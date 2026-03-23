from django.contrib import admin
from .models import Favourite


@admin.register(Favourite)
class FavouriteAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "user",
        "superhero",
        "created_at",
    )

    search_fields = (
        "user__username",
        "superhero__name",
    )