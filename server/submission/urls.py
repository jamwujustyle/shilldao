from django.urls import path
from .views import (
    SubmitTaskView,
    SubmissionsHistoryView,
    SubmissionsOverviewView,
    GradeSubmissionView,
    GradeSubmissionsListView,
)

urlpatterns = [
    path("task/submit", SubmitTaskView.as_view(), name="submit-task"),
    path(
        "submissions-history",
        SubmissionsHistoryView.as_view(),
        name="submissions-history",
    ),
    path(
        "submissions-overview",
        SubmissionsOverviewView.as_view(),
        name="submissions-overview",
    ),
    path(
        "moderation/submissions-history",
        GradeSubmissionsListView.as_view(),
        name="submissions-moderation",
    ),
    path(
        "moderation/submission/<int:pk>/grade",
        GradeSubmissionView.as_view(),
        name="grade-submission",
    ),
]
