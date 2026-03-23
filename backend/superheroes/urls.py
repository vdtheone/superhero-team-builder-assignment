from django.urls import path
from .views import SuperheroListView, SuperheroDetailView, HeroImageProxy


urlpatterns = [
    path("", SuperheroListView.as_view(), name="superhero-list"),
    path("<int:pk>/", SuperheroDetailView.as_view(), name="superhero-detail"),
    path("image-proxy/", HeroImageProxy.as_view(), name="hero-image-proxy"),
]