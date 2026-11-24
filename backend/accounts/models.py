
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):

    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Administrator"
        POLICE = "POLICE", "Police Officer"
        PSWO = "PSWO", "Probation and Social Welfare Officer"
        LEGAL_AID = "LEGAL_AID", "Legal Aid Provider"
        COMMUNITY = "COMMUNITY", "Community Member"

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.COMMUNITY,
    )

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
