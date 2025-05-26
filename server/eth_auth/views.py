from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

from drf_spectacular.utils import (
    extend_schema,
    OpenApiResponse,
    OpenApiExample,
)  # Added
from django.contrib.auth import get_user_model

from .serializers import NonceSerializer, SignatureSerializer

from utils.exception_handler import ErrorHandlingMixin


@extend_schema(
    tags=["auth"],
    summary="Request a Nonce for Signing",
    description="Generates and returns a unique nonce and timestamp for a given Ethereum address. This nonce should be signed by the user to prove ownership of the address.",
    request=NonceSerializer,
    responses={
        200: OpenApiResponse(
            description="Nonce and timestamp generated successfully.",
            examples=[
                OpenApiExample(
                    "Example Nonce Response",
                    value={
                        "eth_address": "0x123...",
                        "timestamp": "1678886400.123456",
                        "nonce": "a1b2c3d4e5f6",
                    },
                    response_only=True,
                )
            ],
        ),
        400: OpenApiResponse(
            description="Invalid input (e.g., malformed Ethereum address)."
        ),
    },
)
class NonceManagerView(ErrorHandlingMixin, APIView):
    serializer_class = NonceSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        response = serializer.create(serializer.validated_data)

        if "timestamp" in response and "nonce" in response:
            return Response(response)
        else:
            raise ValueError("Missing required fields in response")


@extend_schema(
    tags=["auth"],
    summary="Verify Signature and Authenticate User",
    description="Verifies a signed message (nonce + timestamp) against an Ethereum address. If valid, it authenticates the user (creating an account if one doesn't exist) and returns JWT access and refresh tokens, along with the user's role.",
    request=SignatureSerializer,
    responses={
        200: OpenApiResponse(
            description="Signature verified, user authenticated, tokens issued.",
            examples=[
                OpenApiExample(
                    "Example Auth Success Response",
                    value={
                        "is_success": True,
                        "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                        "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                        "role": "User",
                    },
                    response_only=True,
                )
            ],
        ),
        400: OpenApiResponse(
            description="Invalid input (e.g., signature mismatch, expired timestamp, malformed data)."
        ),
    },
)
class SignatureVerifierView(ErrorHandlingMixin, APIView):
    serializer_class = SignatureSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        eth_address: str = serializer.validated_data["eth_address"]

        User = get_user_model()
        user, created = User.objects.get_or_create(eth_address=eth_address.lower())

        refresh = RefreshToken.for_user(user)

        response_data = {
            "is_success": True,
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "role": user.get_role_display(),
        }
        return Response(response_data, status=status.HTTP_200_OK)
