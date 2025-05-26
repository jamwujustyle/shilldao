from django.urls import path  # Corrected import for path
from .views import (
    UsernameView,
    UserImageView,
    UserView,
    UserImageRemoveView,
    ToggleFavoriteDAOView,  # Added import for the new view
    UserRewardsView,
)

urlpatterns = [
    path("username/update", UsernameView.as_view(), name="username-update"),
    path("user-image/update", UserImageView.as_view(), name="user-image-update"),
    path("user-image/remove", UserImageRemoveView.as_view(), name="user-image-remove"),
    path("user/me", UserView.as_view(), name="user-me"),
    path(
        "user/favorites/daos/<int:dao_id>/toggle",  # Removed trailing slash
        ToggleFavoriteDAOView.as_view(),
        name="toggle-favorite-dao",
    ),
    path("my-rewards", UserRewardsView.as_view(), name="my-rewards"),
]
