from django.db import models


class Superhero(models.Model):
    """
    superheros API model
    """

    ALIGNMENT_CHOICES = [
        ("good", "Hero"),
        ("bad", "Villain"),
        ("neutral", "Neutral"),
        ("unknown", "Unknown"),
    ]

    api_id = models.IntegerField(unique=True)
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)

    # Power stats
    intelligence = models.IntegerField(default=0)
    strength = models.IntegerField(default=0)
    speed = models.IntegerField(default=0)
    durability = models.IntegerField(default=0)
    power = models.IntegerField(default=0)
    combat = models.IntegerField(default=0)

    # Biography
    full_name = models.CharField(max_length=255, blank=True)
    alter_egos = models.CharField(max_length=255, blank=True)
    aliases = models.JSONField(default=list, blank=True)
    place_of_birth = models.CharField(max_length=255, blank=True)
    first_appearance = models.CharField(max_length=255, blank=True)
    publisher = models.CharField(max_length=255, blank=True)
    alignment = models.CharField(max_length=20, choices=ALIGNMENT_CHOICES)

    # Appearance
    gender = models.CharField(max_length=50, blank=True)
    race = models.CharField(max_length=100, blank=True)
    height_cm = models.FloatField(null=True, blank=True)
    weight_kg = models.FloatField(null=True, blank=True)
    eye_color = models.CharField(max_length=50, blank=True)
    hair_color = models.CharField(max_length=50, blank=True)

    # Work
    occupation = models.CharField(max_length=255, blank=True)
    base = models.CharField(max_length=255, blank=True)

    image_url = models.URLField(blank=True)

    # Track manual edits
    is_edited = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def total_power(self):
        return (
            self.intelligence
            + self.strength
            + self.speed
            + self.durability
            + self.power
            + self.combat
        )

    def __str__(self):
        return self.name