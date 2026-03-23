from rest_framework import serializers
from .models import Favourite
from superheroes.serializers import SuperheroSerializer


class FavouriteSerializer(serializers.ModelSerializer):

    hero_name = serializers.CharField(
        source="superhero.name",
        read_only=True
    )

    superhero_details = SuperheroSerializer(
        source="superhero",
        read_only=True
    )

    class Meta:
        model = Favourite
        fields = [
            "id",
            "superhero",
            "hero_name",
            "superhero_details",
            "created_at",
        ]