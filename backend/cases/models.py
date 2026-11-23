import uuid

from django.conf import settings
from django.db import models


class Case(models.Model):

    class IncidentType(models.TextChoices):
        ABUSE = "ABUSE", "Abuse"
        NEGLECT = "NEGLECT", "Neglect"
        EXPLOITATION = "EXPLOITATION", "Exploitation"
        VIOLENCE = "VIOLENCE", "Violence"
        OTHER = "OTHER", "Other"

    class Status(models.TextChoices):
        NEW = "NEW", "New"
        UNDER_REVIEW = "UNDER_REVIEW", "Under Review"
        ACTIVE = "ACTIVE", "Active"
        CLOSED = "CLOSED", "Closed"

    reference_number = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False,
    )

    child_name = models.CharField(max_length=150)
    child_age = models.PositiveSmallIntegerField()

    incident_type = models.CharField(
        max_length=20,
        choices=IncidentType.choices,
    )

    description = models.TextField()
    incident_date = models.DateField()
    district = models.CharField(max_length=100)

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.NEW,
    )

    assigned_officer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_cases",
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="registered_cases",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return str(self.reference_number)