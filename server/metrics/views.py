from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from utils.exception_handler import ErrorHandlingMixin
from rest_framework.permissions import AllowAny
from drf_spectacular.utils import (
    extend_schema,
    OpenApiResponse,
    OpenApiParameter,
    OpenApiExample,
)
from drf_spectacular.types import OpenApiTypes
from core.models import User
from campaign.models import Campaign
from task.models import Task
from reward.models import Reward
from submission.models import Submission
from django.core.cache import cache
from .serializers import (
    DashboardStatisticsSerializer,
    TopShillersSerializer,
    TopShillersExtendedSerializer,
    CampaignGraphSerializer,
    RewardGraphSerializer,
    TierDistributionGraphSerializer,
)
from logging_config import logger
from django.db.models import Count, Q, Sum
from django.db.models.functions import TruncMonth
from datetime import timedelta
from django.utils import timezone
from datetime import datetime


@extend_schema(
    tags=["statistics"],
    summary="Get Dashboard Statistics",
    description="Retrieves aggregated statistics for the dashboard, such as active shillers, total campaigns, total tasks, and average approval rate. Can be filtered by a timeframe.",
    parameters=[
        OpenApiParameter(
            name="timeframe",
            description='Filter statistics by time. Options: "all" (default), "daily", "weekly", "monthly".',
            required=False,
            type=OpenApiTypes.STR,
            enum=["all", "daily", "weekly", "monthly"],
        )
    ],
    responses={
        200: OpenApiResponse(
            response=DashboardStatisticsSerializer,
            description="Dashboard statistics retrieved successfully.",
        )
    },
)
class DashboardStatisticsView(ErrorHandlingMixin, APIView):
    serializer_class = DashboardStatisticsSerializer
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        timeframe = request.query_params.get("timeframe", "all")

        now = timezone.now()

        match timeframe:
            case "daily":
                since = now - timedelta(days=1)
            case "weekly":
                since = now - timedelta(days=7)
            case "monthly":
                since = now - timedelta(days=30)
            case _:
                since = None

        active_shillers_count = (
            User.objects.filter(is_active=True, submissions__created_at__gte=since)
            .distinct()
            .count()
            if since
            else User.objects.filter(is_active=True).count()
        )

        campaign_qs = Campaign.objects.exclude(status=3)
        if since:
            campaign_qs = campaign_qs.filter(created_at__gte=since)
        total_campaigns_count = campaign_qs.count()

        task_qs = Task.objects.exclude(status=2)
        if since:
            task_qs = task_qs.filter(created_at__gte=since)
        total_tasks_count = task_qs.count()

        submission_qs = Submission.objects.all()
        if since:
            submission_qs = submission_qs.filter(created_at__gte=since)

        # Try to get Shill token prices from cache
        shill_price_usd = cache.get("shill_price_usd")

        # If not found in cache, try to get it directly from Redis
        if shill_price_usd is None:
            logger.critical("failed to fetch shill prices from cache trying from redis")

        logger.critical(f"shill price usd from cache: {shill_price_usd}")
        serializer = self.serializer_class(
            {
                "active_shillers": active_shillers_count,
                "total_campaigns": total_campaigns_count,
                "total_tasks": total_tasks_count,
                "shill_price_usd": shill_price_usd,
            }
        )
        return Response(serializer.data, status=status.HTTP_200_OK)


@extend_schema(
    tags=["statistics"],
    summary="Get Top Shillers (Basic)",
    description="Retrieves a list of the top 10 shillers based on their approved submissions count. Includes basic shiller info.",
    responses={
        200: OpenApiResponse(
            response=TopShillersSerializer(many=True),
            description="Top shillers retrieved successfully.",
        )
    },
)
class TopShillersView(ErrorHandlingMixin, APIView):
    serializer_class = TopShillersSerializer
    permission_classes = [AllowAny]

    def get(self, request):

        top_shillers = (
            User.objects.annotate(
                approved_submissions_count=Count(
                    "submissions",
                    filter=Q(submissions__status=2),
                ),
                total_submissions_count=Count("submissions"),
            )
            .filter(approved_submissions_count__gt=0)
            .order_by("-approved_submissions_count")[:10]
        )

        serializer = self.serializer_class(
            top_shillers, many=True, context={"request": request}
        )
        return Response(serializer.data, status=status.HTTP_200_OK)


@extend_schema(
    tags=["statistics"],
    summary="Get Top Shillers (Extended)",
    description="Retrieves a list of the top 10 shillers with extended information, including role and join date.",
    responses={
        200: OpenApiResponse(
            response=TopShillersExtendedSerializer(many=True),
            description="Extended top shillers retrieved successfully.",
        )
    },
)
class TopShillersExtendedView(TopShillersView):
    permission_classes = [AllowAny]
    serializer_class = TopShillersExtendedSerializer

    def get(self, request, *args, **kwargs):

        return super().get(request, *args, **kwargs)


@extend_schema(
    tags=["graphs"],
    summary="Campaign Activity Graph Data",
    description="Provides data for the campaign activity graph, showing task capacity (sum of task quantities) and approved submissions over time (monthly).",
    responses={
        200: OpenApiResponse(
            response=CampaignGraphSerializer(many=True),
            description="Data for campaign activity graph retrieved successfully.",
            examples=[
                OpenApiExample(
                    "Example Campaign Graph Data",
                    value=[
                        {"name": "Jan", "tasks": 50, "submissions": 30},
                        {"name": "Feb", "tasks": 70, "submissions": 55},
                    ],
                    response_only=True,
                )
            ],
        )
    },
)
class CampaignGraphView(ErrorHandlingMixin, APIView):
    serializer_class = CampaignGraphSerializer
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        # Get monthly task capacity (sum of task.quantity for tasks created in that month)
        tasks_capacity_by_month = (
            Task.objects.annotate(month=TruncMonth("created_at"))
            .values("month")
            .annotate(total_task_quantity=Sum("quantity"))
            .order_by("month")
        )

        # Get monthly approved submissions (count of approved submissions created in that month)
        approved_submissions_by_month = (
            Submission.objects.filter(status=2)
            .annotate(month=TruncMonth("created_at"))
            .values("month")
            .annotate(approved_submission_count=Count("id"))
            .order_by("month")
        )

        # Combine the data
        # Create a dictionary for easy lookup
        tasks_dict = {
            item["month"].strftime("%Y-%m"): item["total_task_quantity"]
            for item in tasks_capacity_by_month
        }
        submissions_dict = {
            item["month"].strftime("%Y-%m"): item["approved_submission_count"]
            for item in approved_submissions_by_month
        }

        # Get all unique months from both datasets, ensuring they are datetime objects for sorting
        all_months_datetime = sorted(
            list(
                set(
                    [item["month"] for item in tasks_capacity_by_month]
                    + [item["month"] for item in approved_submissions_by_month]
                )
            )
        )

        formatted_data = []
        for month_dt in all_months_datetime:
            month_str_lookup = month_dt.strftime("%Y-%m")
            month_display_name = month_dt.strftime("%b")  # For "Jan", "Feb"

            formatted_data.append(
                {
                    "name": month_display_name,
                    "tasks": tasks_dict.get(
                        month_str_lookup, 0
                    ),  # Represents task capacity
                    "submissions": submissions_dict.get(
                        month_str_lookup, 0
                    ),  # Represents approved submissions
                }
            )

        # The serializer is simple (name, tasks, submissions), so direct construction is fine
        # If serializer had more complex validation/transformation, you'd use it here.
        return Response(formatted_data, status=status.HTTP_200_OK)


@extend_schema(
    tags=["graphs"],
    summary="Reward Distribution Graph Data",
    description="Retrieves data for the reward distribution graph. Currently returns all reward records.",
    responses={
        200: OpenApiResponse(
            response=RewardGraphSerializer(many=True),
            description="Reward data retrieved successfully.",
        )
    },
)
class RewardGraphView(ErrorHandlingMixin, APIView):
    permission_classes = [AllowAny]
    serializer_class = RewardGraphSerializer

    def get(self, request, *args, **kwargs):
        rewards_by_month = (
            Reward.objects.annotate(month=TruncMonth("created_at"))
            .values("month")
            .annotate(total_rewards=Sum("reward"))
            .order_by("month")[:10]
        )

        rewards_dict = {
            item["month"].strftime("%Y-%m"): float(item["total_rewards"])
            for item in rewards_by_month
        }

        all_months_sorted = rewards_dict.keys()

        formatted_data = []

        for month_str in all_months_sorted:

            month_dt = datetime.strptime(month_str, "%Y-%m")

            month_display_name = month_dt.strftime("%b")

            formatted_data.append(
                {
                    "name": month_display_name,
                    "rewards": rewards_dict.get(month_str, 0),
                }
            )
        return Response(formatted_data, status=status.HTTP_200_OK)


TIER_LABELS = {
    1: "Bronze",
    2: "Silver",
    3: "Gold",
    4: "Platinum",
    5: "Diamond",
}


@extend_schema(
    tags=["graphs"],
    summary="User Tier Distribution Graph Data",
    description="Provides data for the user tier distribution pie chart, showing the count of users in each tier.",
    responses={
        200: OpenApiResponse(
            response=TierDistributionGraphSerializer(many=True),
            description="Tier distribution data retrieved successfully.",
            examples=[
                OpenApiExample(
                    "Example Tier Distribution",
                    value=[
                        {"name": "Bronze", "value": 50},
                        {"name": "Silver", "value": 30},
                        {"name": "Gold", "value": 15},
                        {"name": "Platinum", "value": 4},
                        {"name": "Diamond", "value": 1},
                    ],
                    response_only=True,
                )
            ],
        )
    },
)
class TierDistributionGraphView(ErrorHandlingMixin, APIView):
    serializer_class = TierDistributionGraphSerializer
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        data = User.objects.values("tier").annotate(value=Count("id")).order_by("tier")

        tiers = [
            {"name": TIER_LABELS[item["tier"]], "value": item["value"]} for item in data
        ]
        serializer = self.serializer_class(tiers, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
