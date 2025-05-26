from django.urls import path
from .views import (
    DashboardStatisticsView,
    TopShillersView,
    TopShillersExtendedView,
    CampaignGraphView,
    TierDistributionGraphView,
    RewardGraphView,
)

urlpatterns = [
    path(
        "statistics/overview",
        DashboardStatisticsView.as_view(),
        name="statistics-overview",
    ),
    path("top-shillers", TopShillersView.as_view(), name="top-shillers"),
    path(
        "top-shillers-extended",
        TopShillersExtendedView.as_view(),
        name="top-shillers-extended",
    ),
    path("campaigns-graph", CampaignGraphView.as_view(), name="campaigns-graph"),
    path("rewards-graph", RewardGraphView.as_view(), name="rewards"),
    path("tier-graph", TierDistributionGraphView.as_view(), name="tier-graph"),
]
