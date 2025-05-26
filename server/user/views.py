from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from utils.exception_handler import ErrorHandlingMixin
from drf_spectacular.utils import (
    extend_schema,
    OpenApiResponse,
    OpenApiExample,
    OpenApiTypes,
)  # Added OpenApiResponse, OpenApiExample, OpenApiTypes
from .serializers import (
    UsernameSerializer,
    UserImageSerializer,
    UserSerializer,
    UserRewardsSerializer,
)
from reward.models import Reward
from django.db.models import Sum
from dao.models import DAO


@extend_schema(
    tags=["user"],
    summary="Update Username",
    description="Allows an authenticated user to update their username.",
    request=UsernameSerializer,
    responses={
        200: OpenApiResponse(description="Username updated successfully."),
        400: OpenApiResponse(
            description="Invalid input (e.g., username already taken or invalid format)."
        ),
        401: OpenApiResponse(
            description="Authentication credentials were not provided."
        ),
    },
)
class UsernameView(ErrorHandlingMixin, APIView):
    serializer_class = UsernameSerializer
    # permission_classes = [IsAuthenticated] # Implicitly from request.user usage

    def patch(self, request, *args, **kwargs):
        user = request.user
        serializer = self.serializer_class(
            instance=user, data=request.data, partial=False  # Changed to False
        )
        serializer.is_valid(raise_exception=True)

        serializer.save()

        return Response(status=status.HTTP_200_OK)


@extend_schema(
    tags=["user"],
    summary="Update User Profile Image",
    description="Allows an authenticated user to upload or update their profile image. Expects multipart/form-data.",
    request={  # Explicitly define for multipart
        "multipart/form-data": UserImageSerializer
    },
    responses={
        200: OpenApiResponse(description="Profile image updated successfully."),
        400: OpenApiResponse(description="Invalid input or image format/size issue."),
        401: OpenApiResponse(
            description="Authentication credentials were not provided."
        ),
    },
)
class UserImageView(ErrorHandlingMixin, APIView):
    serializer_class = UserImageSerializer
    # permission_classes = [IsAuthenticated] # Implicitly from request.user usage

    def patch(self, request, *args, **kwargs):
        user = request.user
        serializer = self.serializer_class(
            instance=user, data=request.data, partial=True
        )

        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(status=status.HTTP_200_OK)


@extend_schema(
    tags=["user"],
    summary="Remove User Profile Image",
    description="Allows an authenticated user to remove their current profile image.",
    responses={
        204: OpenApiResponse(description="Profile image removed successfully."),
        401: OpenApiResponse(
            description="Authentication credentials were not provided."
        ),
    },
)
class UserImageRemoveView(ErrorHandlingMixin, generics.DestroyAPIView):
    serializer_class = (
        UserImageSerializer  # Not strictly needed for DELETE but good for consistency
    )
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def perform_destroy(self, instance):
        """
        Overrides the default destroy behavior to only remove the image,
        not delete the user object.
        """
        instance.image.delete(save=False)  # Delete the file from storage
        instance.image = None
        instance.save()


@extend_schema(tags=["user"])
class ToggleFavoriteDAOView(ErrorHandlingMixin, APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Toggle favorite status for a DAO",
        request=None,
        responses={
            200: OpenApiResponse(
                response=OpenApiTypes.OBJECT,
                description="Favorite status toggled successfully.",
                examples=[
                    OpenApiExample(
                        "Favorited",
                        value={
                            "status": "favorited",
                            "detail": "DAO successfully favorited.",
                        },
                        response_only=True,
                    ),
                    OpenApiExample(
                        "Unfavorited",
                        value={
                            "status": "unfavorited",
                            "detail": "DAO successfully unfavorited.",
                        },
                        response_only=True,
                    ),
                ],
            ),
            404: OpenApiResponse(description="DAO not found"),
        },
    )
    def post(self, request, dao_id, *args, **kwargs):
        user = request.user
        try:
            dao = DAO.objects.get(pk=dao_id)
        except DAO.DoesNotExist:
            return Response(
                {"detail": "DAO not found."}, status=status.HTTP_404_NOT_FOUND
            )

        if dao in user.favorite_daos.all():
            user.favorite_daos.remove(dao)
            action = "unfavorited"
        else:
            user.favorite_daos.add(dao)
            action = "favorited"

        # Optionally, return the updated user or just a success message
        # For simplicity, returning a success message with the action taken:
        return Response(
            {"status": action, "detail": f"DAO successfully {action}."},
            status=status.HTTP_200_OK,
        )

    # Removed erroneous destroy method


@extend_schema(
    tags=["user"],
    summary="Retrieve Authenticated User Details",
    description="Retrieves the profile details of the currently authenticated user.",
    responses={
        200: OpenApiResponse(
            response=UserSerializer, description="User details retrieved successfully."
        ),
        401: OpenApiResponse(
            description="Authentication credentials were not provided."
        ),
    },
)
class UserView(ErrorHandlingMixin, generics.RetrieveAPIView):
    serializer_class = UserSerializer
    # permission_classes = [IsAuthenticated] # Implicitly from get_object using request.user

    def get_object(self):
        return self.request.user


@extend_schema(
    tags=["user"],
    summary="Retrieve User Rewards",
    description="Retrieves a paginated list of rewards for the authenticated user.",
    responses={
        200: OpenApiResponse(
            response=UserRewardsSerializer(),  # As it's a list view
            description="Successfully retrieved list of user rewards.",
        ),
        401: OpenApiResponse(
            description="Authentication credentials were not provided."
        ),
    },
)
class UserRewardsView(ErrorHandlingMixin, generics.ListAPIView):
    serializer_class = UserRewardsSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Reward.objects.filter(user=self.request.user).order_by("-created_at")[
            :10
        ]

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)

        # Calculate total reward amount
        total_amount = (
            Reward.objects.filter(user=self.request.user).aggregate(
                total=Sum("reward")
            )["total"]
            or 0
        )

        # Add total_amount to the response data
        response.data = {"results": response.data, "total_amount": total_amount}

        return response
