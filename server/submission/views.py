from rest_framework import generics, status
from .serializers import (
    SubmitTaskSerializer,
    SubmissionsHistorySerializer,
    GradeSubmissionSerializer,
)
from utils.exception_handler import ErrorHandlingMixin
from drf_spectacular.utils import (
    extend_schema,
    OpenApiResponse,
    OpenApiParameter,
    OpenApiExample,
)  # Added
from drf_spectacular.types import OpenApiTypes  # Added
from .models import Submission
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import filters
from .permissions import IsModerator
from django.db.models import Count, Q
from django_filters.rest_framework import DjangoFilterBackend
from utils.pagination import TenResultsSetPagination


@extend_schema(
    tags=["submissions"],
    summary="Submit a Task",
    description="Allows an authenticated user to submit their work for a specific task.",
    request=SubmitTaskSerializer,
    responses={
        201: OpenApiResponse(
            response=SubmitTaskSerializer,
            description="Submission created successfully.",
        ),
        400: OpenApiResponse(description="Invalid input."),
        401: OpenApiResponse(
            description="Authentication credentials were not provided."
        ),
    },
)
class SubmitTaskView(ErrorHandlingMixin, generics.CreateAPIView):
    serializer_class = SubmitTaskSerializer
    # permission_classes = [IsAuthenticated] # Implicitly required by perform_create

    def perform_create(self, serializer):
        submission = serializer.save(user=self.request.user)
        task = submission.task
        if task.submissions.count() >= task.quantity and task.status != 2:
            task.status = 2
            task.save()


@extend_schema(
    tags=["submissions"],
    summary="User's Submissions History",
    description="Retrieve a paginated list of the authenticated user's past submissions, with filtering and ordering options.",
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
        OpenApiParameter(
            name="status",
            description="Filter submissions by status (e.g., 1 for Pending, 2 for Approved, 3 for Rejected).",
            required=False,
            type=OpenApiTypes.INT,
        ),
        OpenApiParameter(
            name="ordering",
            description="Order results by fields (e.g., created_at, -created_at).",
            required=False,
            type=OpenApiTypes.STR,
        ),
    ],
    responses={
        200: OpenApiResponse(
            response=SubmissionsHistorySerializer(many=True),
            description="Successfully retrieved submission history.",
        ),
        401: OpenApiResponse(
            description="Authentication credentials were not provided."
        ),
    },
)
class SubmissionsHistoryView(ErrorHandlingMixin, generics.ListAPIView):
    serializer_class = SubmissionsHistorySerializer
    pagination_class = TenResultsSetPagination
    # permission_classes = [IsAuthenticated] # Implicitly required by get_queryset
    filter_backends = [
        DjangoFilterBackend,
        filters.OrderingFilter,
    ]
    filterset_fields = ["status"]
    ordering_fields = ["created_at"]

    def get_queryset(self):
        return Submission.objects.filter(user=self.request.user).order_by("-created_at")


@extend_schema(
    tags=["submissions"],
    summary="User's Submissions Overview",
    description="Provides a summary count of the authenticated user's submissions by status (Pending, Approved, Rejected).",
    responses={
        200: OpenApiResponse(
            description="Submission overview counts.",
            examples=[
                OpenApiExample(
                    "Example Overview",
                    value={
                        "pending_submissions": 5,
                        "approved_submissions": 10,
                        "rejected_submissions": 2,
                    },
                    response_only=True,
                )
            ],
        ),
        401: OpenApiResponse(
            description="Authentication credentials were not provided."
        ),
    },
)
class SubmissionsOverviewView(ErrorHandlingMixin, APIView):
    # permission_classes = [IsAuthenticated] # Implicitly required by get method logic

    def get(self, request, *args, **kwargs):
        user_submissions = Submission.objects.filter(user=request.user)

        # Overall counts
        pending_submissions = user_submissions.filter(status=1).count()  # 1 for Pending
        approved_submissions = user_submissions.filter(
            status=2
        ).count()  # 2 for Approved
        rejected_submissions = user_submissions.filter(
            status=3
        ).count()  # 3 for Rejected

        # Counts per proof type
        text_total = user_submissions.filter(proof_type=1).count()  # 1 for Text
        text_approved = user_submissions.filter(
            proof_type=1, status=2  # Text, Approved
        ).count()

        image_total = user_submissions.filter(proof_type=2).count()  # 2 for Image
        image_approved = user_submissions.filter(
            proof_type=2, status=2  # Image, Approved
        ).count()

        video_total = user_submissions.filter(proof_type=3).count()  # 3 for Video
        video_approved = user_submissions.filter(
            proof_type=3, status=2  # Video, Approved
        ).count()

        overview = {
            "pendingSubmissions": pending_submissions,  # Keep camelCase for frontend
            "approvedSubmissions": approved_submissions,  # Keep camelCase for frontend
            "rejectedSubmissions": rejected_submissions,  # Keep camelCase for frontend
            "textSubmissions": {"total": text_total, "approved": text_approved},
            "imageSubmissions": {"total": image_total, "approved": image_approved},
            "videoSubmissions": {"total": video_total, "approved": video_approved},
        }

        return Response(overview, status=status.HTTP_200_OK)


# !: GRADE VIEWS
class GradeSubmissionAbstract(ErrorHandlingMixin, APIView):
    serializer_class = GradeSubmissionSerializer
    permission_classes = [IsModerator]


@extend_schema(
    tags=["grading"],
    summary="List Submissions for Grading",
    description="For moderators: Retrieve a paginated list of all submissions for grading, with filtering and ordering options.",
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
        OpenApiParameter(
            name="status",
            description="Filter submissions by status.",
            required=False,
            type=OpenApiTypes.INT,
        ),
        OpenApiParameter(
            name="proof_type",
            description="Filter submissions by proof type.",
            required=False,
            type=OpenApiTypes.INT,
        ),
        OpenApiParameter(
            name="ordering",
            description="Order results by fields (e.g., created_at).",
            required=False,
            type=OpenApiTypes.STR,
        ),
    ],
    responses={
        200: OpenApiResponse(
            response=GradeSubmissionSerializer(many=True),
            description="Successfully retrieved submissions for grading.",
        ),
        401: OpenApiResponse(
            description="Authentication credentials were not provided."
        ),
        403: OpenApiResponse(description="User is not a moderator."),
    },
)
class GradeSubmissionsListView(GradeSubmissionAbstract, generics.ListAPIView):
    pagination_class = TenResultsSetPagination
    filter_backends = [
        DjangoFilterBackend,
        filters.OrderingFilter,
    ]  # Ensure DjangoFilterBackend is correctly configured if used
    filterset_fields = ["status", "proof_type"]
    ordering_fields = ["created_at"]  #
    queryset = (
        Submission.objects.select_related("task__campaign__dao")
        .all()
        .order_by("-created_at")
    )

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)

        if isinstance(response.data, dict) and "results" in response.data:
            totals = Submission.objects.aggregate(
                pending_submissions=Count("id", filter=Q(status=1)),
                approved_submissions=Count("id", filter=Q(status=2)),
                rejected_submissions=Count("id", filter=Q(status=3)),
            )
            response.data["pending_submissions"] = totals["pending_submissions"]
            response.data["approved_submissions"] = totals["approved_submissions"]
            response.data["rejected_submissions"] = totals["rejected_submissions"]

        return response


@extend_schema(tags=["grading"])
class GradeSubmissionView(GradeSubmissionAbstract):

    @extend_schema(
        summary="Retrieve a Submission for Grading",
        description="For moderators: Retrieve details of a specific submission for grading.",
        responses={
            200: OpenApiResponse(
                response=GradeSubmissionSerializer, description="Submission details."
            ),
            401: OpenApiResponse(
                description="Authentication credentials were not provided."
            ),
            403: OpenApiResponse(description="User is not a moderator."),
            404: OpenApiResponse(description="Submission not found."),
        },
    )
    def get(self, request, pk):
        submission = (
            Submission.objects.select_related("task__campaign__dao")
            .filter(pk=pk)
            .annotate(
                approved_count=Count(
                    "user__submissions", filter=Q(user__submissions__status=2)
                ),
                rejected_count=Count(
                    "user__submissions", filter=Q(user__submissions__status=3)
                ),
            )
            .get(pk=pk)
        )

        serializer = self.serializer_class(
            submission,
            context={
                "request": request,
                "view_action": "retrieve",
            },
        )

        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Grade a Submission",
        description="For moderators: Update the status (grade) of a specific submission.",
        request=GradeSubmissionSerializer,  # Or a more specific serializer for partial update if fields are limited
        responses={
            200: OpenApiResponse(
                response=GradeSubmissionSerializer,
                description="Submission graded successfully.",
            ),
            400: OpenApiResponse(description="Invalid input."),
            401: OpenApiResponse(
                description="Authentication credentials were not provided."
            ),
            403: OpenApiResponse(description="User is not a moderator."),
            404: OpenApiResponse(description="Submission not found."),
        },
    )
    def patch(self, request, pk):
        submission = Submission.objects.select_related("task__campaign__dao").get(pk=pk)
        serializer = self.serializer_class(
            submission,
            data=request.data,
            partial=True,
            context={"request": request, "view_action": "patch"},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data, status=status.HTTP_200_OK)
