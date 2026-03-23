from django.db import models
from superheroes.models import Superhero
from users.models import User


class Team(models.Model):
    """
    Represents a team of superheroes
    """

    name = models.CharField(max_length=255)
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="teams"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['name', 'created_by'], 
                name='unique_team_name_per_user'
            )
        ]

    def __str__(self):
        return self.name


class TeamMember(models.Model):
    """
    Represents superheroes belonging to a team
    """

    team = models.ForeignKey(
        Team,
        on_delete=models.CASCADE,
        related_name="members"
    )

    superhero = models.ForeignKey(
        Superhero,
        on_delete=models.CASCADE
    )

    def __str__(self):
        return f"{self.superhero.name} in {self.team.name}"