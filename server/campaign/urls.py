from django.urls import path
from .views import (
    CampaignView,
    CampaignTasksView,
    MyCampaignsView,
    CampaignOverviewView,
)
from .transaction_views import TransactionVerifiedCampaignCreateView

urlpatterns = [
    path(
        "campaigns", CampaignView.as_view(), name="campaign-list"
    ),  # Renamed for clarity
    path(
        "campaigns/create-verified",
        TransactionVerifiedCampaignCreateView.as_view(),
        name="campaign-create-verified",
    ),
    path(
        "campaigns/<int:campaign_id>/tasks/",
        CampaignTasksView.as_view(),
        name="campaign-tasks",
    ),
    path("my-campaigns", MyCampaignsView.as_view(), name="my-campaigns"),
    path(
        "campaigns-overview", CampaignOverviewView.as_view(), name="campaigns-overview"
    ),
]
