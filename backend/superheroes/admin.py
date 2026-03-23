from django.contrib import admin
from .models import Superhero

@admin.register(Superhero)
class SuperheroAdmin(admin.ModelAdmin):
    list_display = ("name", "alignment", "publisher", "total_power", "created_at", "updated_at", "is_edited", "api_id", "slug", "image_url")
    search_fields = ("name", "full_name", "alter_egos", "publisher")
    list_filter = ("alignment", "publisher")
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = ("created_at", "updated_at")
    ordering = ("name",)
    fieldsets = (
    ("Basic Info", {
        "fields": ("name", "slug", "api_id", "alignment", "publisher", "image_url")
    }),
    ("Power Stats", {
        "fields": ("intelligence", "strength", "speed", "durability", "power", "combat")
    }),
    ("Biography", {
        "fields": ("full_name", "alter_egos", "aliases", "place_of_birth", "first_appearance")
    }),
    ("Appearance", {
        "fields": ("gender", "race", "height_cm", "weight_kg", "eye_color", "hair_color")
    }),
    ("Work", {
        "fields": ("occupation", "base")
    }),
    ("Metadata", {
        "fields": ("is_edited", "created_at", "updated_at")
    }),
)