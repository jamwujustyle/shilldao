from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from utils.exception_handler import ErrorHandlingMixin
from utils.pagination import (
    DAOResultsSetPagination,
)
from .serializers import DAOExplorerSerializer, MyDAOsSerializer, MyDAOEditSerializer
from .models import DAO
from drf_spectacular.utils import (
    extend_schema,
    OpenApiResponse,
    OpenApiParameter,
    OpenApiExample,  # Added for schema examples
)
from drf_spectacular.types import OpenApiTypes

from django.db.models import Count
from rest_framework.permissions import AllowAny, IsAuthenticated
from task.models import Task


@extend_schema(tags=["daos"])
class DAOView(ErrorHandlingMixin, APIView):
    serializer_class = DAOExplorerSerializer
    pagination_class = DAOResultsSetPagination

    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.request.method == "POST":
            return [IsAuthenticated()]
        return [AllowAny()]

    @extend_schema(
        summary="List all DAOs",
        description="Retrieve a paginated list of all DAOs. Each DAO includes an `is_favorited` field indicating if the currently authenticated user (if any) has favorited it. Supports searching by DAO name.",
        parameters=[
            OpenApiParameter(
                name="search",
                description="Term to search for in DAO names.",
                required=False,
                type=OpenApiTypes.STR,
            ),
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
                name="ordering",
                description="Which field to use for ordering the results. Use 'popular' to order by most favorited.",
                required=False,
                type=OpenApiTypes.STR,
                enum=[
                    "popular",
                    "-created_at",
                    "created_at",
                ],  # Add other valid options if any
            ),
        ],
        responses={
            200: OpenApiResponse(
                response=DAOExplorerSerializer(many=True),
                description="Successfully retrieved list of DAOs.",
            )
        },
    )
    def get(self, request, *args, **kwargs):
        queryset = (
            DAO.objects.annotate(campaign_count=Count("campaigns"))
            .filter(campaign_count__gt=0)
            .prefetch_related("campaigns")
        )

        search_term = request.query_params.get("search", None)
        if search_term:
            queryset = queryset.filter(name__icontains=search_term)

        ordering = request.query_params.get("ordering", "-created_at")
        if ordering == "popular":
            queryset = queryset.annotate(
                num_favorites=Count("favorited_by_users")
            ).order_by("-num_favorites", "-created_at")
        else:
            queryset = queryset.order_by(ordering)

        daos_queryset = queryset.all()

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(daos_queryset, request, view=self)

        if page is not None:
            serializer = self.serializer_class(
                page, many=True, context={"request": request}
            )
            return paginator.get_paginated_response(serializer.data)

        serializer = self.serializer_class(
            daos_queryset, many=True, context={"request": request}
        )
        return Response(serializer.data, status=status.HTTP_200_OK)


@extend_schema(tags=["daos"])
class FavoriteDAOListView(ErrorHandlingMixin, APIView):
    serializer_class = DAOExplorerSerializer
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="List favorite DAOs",
        description="Retrieve a list of DAOs favorited by the currently authenticated user. Supports searching by DAO name.",
        parameters=[
            OpenApiParameter(
                name="search",
                description="Term to search for in DAO names.",
                required=False,
                type=OpenApiTypes.STR,
            ),
        ],
        responses={
            200: OpenApiResponse(
                response=DAOExplorerSerializer(many=True),
                description="Successfully retrieved list of favorite DAOs.",
            ),
            401: OpenApiResponse(
                description="Authentication credentials were not provided."
            ),
        },
    )
    def get(self, request, *args, **kwargs):
        if (
            not request.user
            or not request.user.is_authenticated
            or not hasattr(request.user, "favorite_daos")
        ):
            return Response(
                {"detail": "Authentication required."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        queryset = (
            request.user.favorite_daos.annotate(campaign_count=Count("campaigns"))
            .filter(campaign_count__gt=0)
            .prefetch_related("campaigns")
            .order_by("-created_at")
        )

        search_term = request.query_params.get("search", None)
        if search_term:
            queryset = queryset.filter(name__icontains=search_term)

        favorite_daos_queryset = queryset.all()
        # Note: Favorite DAOs are typically not paginated in this example,
        # but if pagination were added, it would follow the pattern of other views.

        serializer = self.serializer_class(
            favorite_daos_queryset, many=True, context={"request": request}
        )
        return Response(serializer.data, status=status.HTTP_200_OK)


@extend_schema(tags=["daos"])
class MostActiveDAOListView(ErrorHandlingMixin, APIView):
    serializer_class = DAOExplorerSerializer
    permission_classes = [AllowAny]
    pagination_class = DAOResultsSetPagination

    @extend_schema(
        summary="List most active DAOs",
        description="Retrieve a paginated list of DAOs, ordered by the total number of their campaigns in descending order. Each DAO includes an `is_favorited` field indicating if the currently authenticated user (if any) has favorited it. Supports searching by DAO name.",
        parameters=[
            OpenApiParameter(
                name="search",
                description="Term to search for in DAO names.",
                required=False,
                type=OpenApiTypes.STR,
            ),
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
                response=DAOExplorerSerializer(many=True),
                description="Successfully retrieved list of most active DAOs.",
            )
        },
    )
    def get(self, request, *args, **kwargs):
        queryset = (
            DAO.objects.annotate(campaign_count=Count("campaigns"))
            .filter(campaign_count__gt=0)
            .order_by("-campaign_count", "-created_at")
            .prefetch_related("campaigns")
        )

        search_term = request.query_params.get("search", None)
        if search_term:
            queryset = queryset.filter(name__icontains=search_term)

        daos_queryset = queryset.all()

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(daos_queryset, request, view=self)

        if page is not None:
            serializer = self.serializer_class(
                page, many=True, context={"request": request}
            )
            return paginator.get_paginated_response(serializer.data)

        serializer = self.serializer_class(
            daos_queryset, many=True, context={"request": request}
        )
        return Response(serializer.data, status=status.HTTP_200_OK)


@extend_schema(tags=["daos"])
class RegisterDAOView(ErrorHandlingMixin, APIView):
    serializer_class = DAOExplorerSerializer
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Register a new DAO",
        description="Create a new DAO with the provided information. Authentication is required.",
        request=DAOExplorerSerializer,
        responses={
            201: OpenApiResponse(
                response=DAOExplorerSerializer,
                description="DAO successfully registered.",
                examples=[
                    OpenApiExample(
                        "Example Response",
                        value={
                            "id": "123e4567-e89b-12d3-a456-426614174000",
                            "name": "Example DAO",
                            "description": "A description of the DAO",
                            "image": "https://example.com/image.jpg",
                            "website": "https://example.com",
                            "social_links": {
                                "twitter": "https://twitter.com/exampledao",
                                "discord": "https://discord.gg/exampledao",
                            },
                            "created_at": "2023-01-01T00:00:00Z",
                            "updated_at": "2023-01-01T00:00:00Z",
                            "is_favorited": False,
                        },
                    )
                ],
            ),
            400: OpenApiResponse(
                description="Invalid input data.",
                examples=[
                    OpenApiExample(
                        "Validation Error", value={"name": ["This field is required."]}
                    )
                ],
            ),
            401: OpenApiResponse(
                description="Authentication credentials were not provided."
            ),
        },
    )
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(
            data=request.data, context={"request": request, "view_action": "create"}
        )
        serializer.is_valid(raise_exception=True)

        serializer.save()

        return Response(serializer.data, status=status.HTTP_201_CREATED)


@extend_schema(tags=["daos"])
class MyDAOsView(
    ErrorHandlingMixin,
    generics.ListAPIView,
):
    serializer_class = MyDAOsSerializer
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="List DAOs created by the authenticated user",
        description="Retrieve a list of DAOs created by the currently authenticated user.",
        responses={
            200: OpenApiResponse(
                response=MyDAOsSerializer(many=True),
                description="Successfully retrieved list of user's DAOs.",
            ),
            401: OpenApiResponse(
                description="Authentication credentials were not provided."
            ),
        },
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        return DAO.objects.filter(created_by=self.request.user)


# TODO: ACQUIRE TOKENS VIEW


@extend_schema(tags=["daos"])
class MyDAOEditView(ErrorHandlingMixin, APIView):
    serializer_class = MyDAOEditSerializer
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Edit a DAO",
        description="Update details of a specific DAO created by the authenticated user. Only the creator can edit the DAO.",
        request=MyDAOEditSerializer,
        responses={
            200: OpenApiResponse(
                response=MyDAOEditSerializer,
                description="DAO successfully updated.",
                examples=[
                    OpenApiExample(
                        "Example Response",
                        value={
                            "description": "Updated description.",
                            "image": "https://example.com/new_image.jpg",
                            "website": "https://newexample.com",
                            "social_links": {
                                "twitter": "https://twitter.com/newexampledao",
                                "discord": "https://discord.gg/newexampledao",
                            },
                        },
                    )
                ],
            ),
            400: OpenApiResponse(
                description="Invalid input data.",
                examples=[
                    OpenApiExample(
                        "Validation Error",
                        value={"name": ["This field may not be blank."]},
                    )
                ],
            ),
            401: OpenApiResponse(
                description="Authentication credentials were not provided."
            ),
            403: OpenApiResponse(  # Assuming permission check is handled by IsAuthenticated and object-level permissions if any
                description="Permission denied. You do not have permission to perform this action."
            ),
            404: OpenApiResponse(description="DAO not found."),
        },
    )
    def patch(self, request, pk):
        dao = DAO.objects.get(pk=pk)

        serializer = self.serializer_class(
            dao, data=request.data, partial=True, context={"request": request}
        )

        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Delete a DAO",
        description="Delete a specific DAO created by the authenticated user. Only the creator can delete the DAO.",
        responses={
            204: OpenApiResponse(description="DAO successfully deleted."),
            401: OpenApiResponse(
                description="Authentication credentials were not provided."
            ),
            403: OpenApiResponse(  # Assuming permission check is handled by IsAuthenticated and object-level permissions if any
                description="Permission denied. You do not have permission to perform this action."
            ),
            404: OpenApiResponse(description="DAO not found."),
        },
    )
    def delete(self, request, pk):
        dao = DAO.objects.get(pk=pk)
        if dao.created_by != request.user:  # Corrected from dao.user
            return Response(
                {"detail": "You do not have permission to delete this DAO"},
                status=status.HTTP_403_FORBIDDEN,
            )
        if dao.campaigns.exists() or Task.objects.filter(campaign__dao=dao).exists():
            return Response(
                {
                    "detail": "DAO cannot be deleted because it has associated campaigns or tasks."
                },
                status=status.HTTP_403_FORBIDDEN,
            )
        dao.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
