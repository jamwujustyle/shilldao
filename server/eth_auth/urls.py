from django.urls import path
from .views import NonceManagerView, SignatureVerifierView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path("nonce", NonceManagerView.as_view(), name="nonce"),
    path("verify", SignatureVerifierView.as_view(), name="verify"),
    path("token/refresh", TokenRefreshView.as_view(), name="token-refresh"),
]
