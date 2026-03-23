from django.db import models
from superheroes.models import Superhero
from users.models import User


class Favourite(models.Model):
    """
    Stores user's favourite superheroes
    """

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="favourites"
    )

    superhero = models.ForeignKey(
        Superhero,
        on_delete=models.CASCADE,
        related_name="favourited_by"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "superhero")

    def __str__(self):
        return f"{self.user.username} -> {self.superhero.name}"