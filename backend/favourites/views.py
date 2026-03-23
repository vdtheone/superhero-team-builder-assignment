import logging
from rest_framework import generics, filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError
from .models import Favourite
from .serializers import FavouriteSerializer
from rest_framework.pagination import PageNumberPagination


logger = logging.getLogger('api')


class FavouritePagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class FavouriteListView(generics.ListAPIView):

    serializer_class = FavouriteSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = FavouritePagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["superhero__name"]
    ordering_fields = [
        "created_at",
        "superhero__name",
        "superhero__intelligence",
        "superhero__strength",
        "superhero__speed",
        "superhero__durability",
        "superhero__power",
        "superhero__combat",
    ]

    def get_queryset(self):
        logger.info(f"User {self.request.user} requested their favourite superheroes list.")
        return (
            Favourite.objects
            .select_related("superhero")
            .filter(user=self.request.user)
            .order_by("-created_at")
        )
    

class FavouriteCreateView(generics.CreateAPIView):

    serializer_class = FavouriteSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):

        superhero = serializer.validated_data["superhero"]
        logger.info(f"User {self.request.user} attempting to add superhero {superhero.id} to favourites.")

        if Favourite.objects.filter(
            user=self.request.user,
            superhero=superhero
        ).exists():
            logger.warning(f"User {self.request.user} tried to add duplicate superhero {superhero.id} to favourites.")
            raise ValidationError("Hero already in favourites")

        serializer.save(user=self.request.user)
        logger.info(f"User {self.request.user} successfully added superhero {superhero.id} to favourites.")


class FavouriteDeleteView(generics.DestroyAPIView):

    queryset = Favourite.objects.all()
    serializer_class = FavouriteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Favourite.objects.filter(user=self.request.user)

    def perform_destroy(self, instance):
        logger.info(f"User {self.request.user} removed favourite superhero {instance.superhero_id}.")
        super().perform_destroy(instance)