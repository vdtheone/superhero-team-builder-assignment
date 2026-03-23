from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom user model for the application
    """

    email = models.EmailField(unique=True)

    def __str__(self):
        return self.username