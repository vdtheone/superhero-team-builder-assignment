from django.urls import path
from .views import (
    FavouriteListView,
    FavouriteCreateView,
    FavouriteDeleteView
)

urlpatterns = [
    path("", FavouriteListView.as_view(), name="favourite-list"),
    path("add/", FavouriteCreateView.as_view(), name="favourite-add"),
    path("<int:pk>/delete/", FavouriteDeleteView.as_view(), name="favourite-delete"),
]