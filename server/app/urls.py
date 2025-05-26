from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse  # Added import
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from django.conf.urls.static import static
from django.conf import settings

# from drf_spectacular.utils import extend_schema


draft_urls = [
    path("auth/", include("eth_auth.urls")),
    path("", include("metrics.urls")),
    path("", include("campaign.urls")),
    path("", include("user.urls")),
    path("", include("task.urls")),
    path("", include("submission.urls")),
    path("", include("dao.urls")),
]

urlpatterns = [
    path("api/v1/", include(draft_urls)),  # Removed leading slash
    path("admin/", admin.site.urls),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
    ),
    path(
        "", lambda r: HttpResponse("Shillers server is running"), name="health_check"
    ),  # Added health check view for root
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
