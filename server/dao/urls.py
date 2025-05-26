from django.urls import path
from .views import (
    DAOView,
    FavoriteDAOListView,
    MostActiveDAOListView,
    RegisterDAOView,
    MyDAOsView,
    MyDAOEditView,
)

urlpatterns = [
    path("dao-view", DAOView.as_view(), name="dao"),
    path("favorite-daos", FavoriteDAOListView.as_view(), name="favorite-dao-list"),
    path(
        "most-active-daos", MostActiveDAOListView.as_view(), name="most-active-dao-list"
    ),
    path("register-dao", RegisterDAOView.as_view(), name="register-dao"),
    path("edit-dao/<int:pk>", MyDAOEditView.as_view(), name="edit-dao"),
    path("my-daos", MyDAOsView.as_view(), name="my-daos"),
]
