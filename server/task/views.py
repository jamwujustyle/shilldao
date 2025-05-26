from rest_framework import generics
from .serializers import TaskSerializer, TaskCreateSerializer
from .models import Task
from drf_spectacular.utils import (
    extend_schema,
    OpenApiResponse,
    OpenApiParameter,
    OpenApiExample,
)  # Added
from drf_spectacular.types import OpenApiTypes  # Added
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.db.models import Count, Case, When, Value, BooleanField, Avg, Sum, F
from utils.exception_handler import ErrorHandlingMixin
from utils.pagination import TenResultsSetPagination


@extend_schema(
    tags=["tasks"],
    summary="List all active Tasks",
    description="Retrieve a paginated list of active tasks (status=1), ordered by creation date. The response also includes a count of all completed tasks.",
    parameters=[
        OpenApiParameter(
            name="page",
            description="A page number within the paginated TaskCreateSerializerresult set.",
            required=False,
            type=OpenApiTypes.INT,
        ),
        OpenApiParameter(
            name="page_size",
            description="Number of results to return per page (defaults to 10).",
            required=False,
            type=OpenApiTypes.INT,
        ),
        OpenApiParameter(
            name="campaign",
            description="Filter tasks by a specific campaign ID.",
            required=False,
            type=OpenApiTypes.INT,
        ),
    ],
    responses={
        200: OpenApiResponse(
            description="Successfully retrieved list of active tasks.",
            # Manually define the response structure because of the added 'completed_tasks_count'
            # drf-spectacular might infer the paginated 'results' part from TaskSerializer
            # but we need to document the whole envelope.
            examples=[
                OpenApiExample(
                    "Paginated Task List with Completion Count",
                    value={
                        "count": 100,
                        "next": "http://localhost:8000/api/v1/tasks/?page=2",
                        "previous": None,
                        "results": [
                            {
                                "id": 1,
                                "campaign": 1,
                                "description": "Engage with our latest tweet about X feature.",
                                "type": 1,  # Assuming 1 maps to a type like "Twitter Engagement"
                                "reward": "50.00",
                                "quantity": 100,
                                "submissions_count": 25,  # Annotated field
                                "deadline": "2025-12-31T23:59:59Z",
                                "status": 1,  # Active
                                "created_at": "2025-01-15T10:00:00Z",
                            }
                        ],
                        "completed_tasks_count": 150,
                    },
                    response_only=True,
                )
            ],
        )
    },
)
class TaskView(ErrorHandlingMixin, generics.ListAPIView):

    serializer_class = TaskSerializer
    permission_classes = [AllowAny]
    pagination_class = TenResultsSetPagination  # Apply pagination

    def get_queryset(self):
        queryset = Task.objects.filter(status=1).annotate(
            submissions_count=Count("submissions")
        )

        campaign_id = self.request.query_params.get("campaign")
        if campaign_id:
            queryset = queryset.filter(campaign_id=campaign_id)

        task_type = self.request.query_params.get("type")
        if task_type:
            queryset = queryset.filter(type=task_type)

        user = self.request.user
        if user.is_authenticated and hasattr(user, "favorite_daos"):
            favorite_dao_ids = list(user.favorite_daos.values_list("id", flat=True))
            queryset = queryset.annotate(
                is_from_favorite_dao=Case(
                    When(campaign__dao_id__in=favorite_dao_ids, then=Value(True)),
                    default=Value(False),
                    output_field=BooleanField(),
                )
            )
            # Assuming Task model has a 'created_at' field or similar for ordering
            return queryset.order_by("-is_from_favorite_dao", "-created_at")

        return queryset.order_by(
            "-created_at"
        )  # Default ordering if not authenticated or no favorite_daos attr

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        completed_tasks_count = Task.objects.filter(status=2).count()
        ongoing_tasks = Task.objects.filter(status=1)
        average_reward = ongoing_tasks.aggregate(avg=Avg("reward"))["avg"]
        total_rewards = ongoing_tasks.aggregate(
            total_rewards=Sum(F("reward") * F("quantity"))
        )["total_rewards"]

        if response.data and isinstance(response.data, dict):
            response.data["completed_tasks_count"] = completed_tasks_count
            response.data["average_reward"] = average_reward
            response.data["total_rewards"] = total_rewards
        return response


@extend_schema(
    tags=["tasks"],
    summary="Create a new Task",
    description="Create a new task for a campaign belonging to a DAO created by the authenticated user.",
    request=TaskCreateSerializer,
    responses={
        201: OpenApiResponse(
            response=TaskSerializer, description="Task created successfully."
        ),
        400: OpenApiResponse(description="Invalid data provided."),
        401: OpenApiResponse(
            description="Authentication credentials were not provided."
        ),
        403: OpenApiResponse(
            description="User is not allowed to create a task for the specified campaign."
        ),
    },
)
class TaskCreateView(ErrorHandlingMixin, generics.CreateAPIView):
    serializer_class = TaskCreateSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save()
