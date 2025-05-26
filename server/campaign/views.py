from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from utils.exception_handler import ErrorHandlingMixin
from utils.pagination import StandardResultsSetPagination
from .serializers import (
    CampaignSerializer,
    MyCampaignsSerializer,
    CampaignOverviewSerializer,  # Import the new serializer
)
from drf_spectacular.utils import (
    extend_schema,
    OpenApiResponse,
    OpenApiParameter,
)
from drf_spectacular.types import OpenApiTypes
from .models import Campaign
from task.models import Task
from task.serializers import TaskSerializer
from django.db.models import (
    Count,
    Case,
    When,
    Value,
    BooleanField,
)
from django.db import models
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated


# hello world
@extend_schema(
    tags=["campaigns"],
    summary="List all Campaigns",
    description="Retrieve a paginated list of all campaigns, ordered by most recently created. Each campaign includes a count of its total tasks.",
    parameters=[
        OpenApiParameter(
            name="page",
            description="A page number within the paginated result set.",
            required=False,
            type=OpenApiTypes.INT,
        ),
        OpenApiParameter(
            name="page_size",
            description="Number of results to return per page.",
            required=False,
            type=OpenApiTypes.INT,
        ),
    ],
    responses={
        200: OpenApiResponse(
            response=CampaignSerializer(many=True),
            description="Successfully retrieved list of campaigns.",
        )
    },
)
class CampaignView(ErrorHandlingMixin, generics.ListAPIView):
    serializer_class = CampaignSerializer
    permission_classes = [AllowAny]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = Campaign.objects.annotate(total_tasks=Count("tasks"))

        status_param = self.request.query_params.get("status")
        if status_param:
            try:
                status_value = int(status_param)
                queryset = queryset.filter(status=status_value)
            except ValueError:
                # Handle invalid status value, perhaps return an empty queryset or raise an error
                # For now, we'll just ignore the invalid status and return all campaigns
                pass

        # Annotate to push status 3 (Completed) campaigns to the end
        queryset = queryset.annotate(
            sort_status=Case(
                When(
                    status=3, then=Value(1)
                ),  # Completed campaigns get a higher sort value
                default=Value(0),  # Other statuses get a lower sort value
                output_field=models.IntegerField(),
            )
        )

        user = self.request.user

        if user.is_authenticated and hasattr(user, "favorite_daos"):
            favorite_dao_ids = list(user.favorite_daos.values_list("id", flat=True))
            queryset = queryset.annotate(
                is_from_favorite_dao=Case(
                    When(dao_id__in=favorite_dao_ids, then=Value(True)),
                    default=Value(False),
                    output_field=BooleanField(),
                )
            )
            # Order by sort_status (ascending), then is_from_favorite_dao (descending), then created_at (descending)
            return queryset.order_by(
                "sort_status", "-is_from_favorite_dao", "-created_at"
            )

        # Order by sort_status (ascending), then created_at (descending)
        return queryset.order_by("sort_status", "-created_at")


@extend_schema(
    tags=["campaigns"],
    summary="Get Campaign Overview Statistics",
    description="Retrieve statistics about campaigns, including active, completed, total budget, and total tasks.",
    responses={
        200: OpenApiResponse(
            response=CampaignOverviewSerializer,
            description="Successfully retrieved campaign overview statistics.",
        )
    },
)
class CampaignOverviewView(ErrorHandlingMixin, APIView):
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        # The serializer will handle the aggregation
        serializer = CampaignOverviewSerializer({})  # Pass an empty dictionary as data
        return Response(serializer.data, status=status.HTTP_200_OK)


@extend_schema(
    tags=["campaigns"],
    summary="List Tasks for a Specific Campaign",
    description="Retrieve a list of all tasks associated with a specific campaign ID.",
    parameters=[
        OpenApiParameter(
            name="campaign_id",
            description="The ID of the campaign for which to retrieve tasks.",
            required=True,
            type=OpenApiTypes.INT,
            location=OpenApiParameter.PATH,
        ),
    ],
    responses={
        200: OpenApiResponse(
            response=TaskSerializer(many=True),
            description="Successfully retrieved list of tasks for the campaign.",
        ),
        404: OpenApiResponse(description="Campaign not found."),
    },
)
class CampaignTasksView(ErrorHandlingMixin, generics.ListAPIView):
    serializer_class = TaskSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        campaign_id = self.kwargs.get("campaign_id")
        get_object_or_404(Campaign, pk=campaign_id)
        return Task.objects.filter(campaign_id=campaign_id).order_by("-created_at")

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


@extend_schema(tags=["campaigns"])
class MyCampaignsView(ErrorHandlingMixin, generics.ListAPIView):
    serializer_class = MyCampaignsSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Campaign.objects.filter(dao__created_by=self.request.user)
