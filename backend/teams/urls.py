from django.urls import path
from .views import (
    TeamListCreateView,
    TeamDetailView,
    TeamDeleteView,
    CompareStoredTeamsView,
    RecommendTeamView,
    CompareTeamsView
)

urlpatterns = [
    path("", TeamListCreateView.as_view(), name="team-list"),
    path("<int:pk>/", TeamDetailView.as_view(), name="team-detail"),
    path("<int:pk>/delete/", TeamDeleteView.as_view(), name="team-delete"),
    path("recommend/", RecommendTeamView.as_view(), name="team-recommend"),
    path("compare/", CompareTeamsView.as_view(), name="team-compare"),
    path("compare_stored/", CompareStoredTeamsView.as_view(), name="team-compare-stored"),
]