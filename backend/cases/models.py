import uuid

from django.conf import settings
from django.db import models
from django.core.exceptions import ValidationError

class Case(models.Model):
    class CaseCategory(models.TextChoices):
        CHILD_PROTECTION = (
            "CHILD_PROTECTION",
            "Child Protection / Child Victim",
        )
        CHILD_IN_CONFLICT_WITH_LAW = (
            "CHILD_IN_CONFLICT_WITH_LAW",
            "Child in Conflict with the Law",
        )

    class IncidentType(models.TextChoices):
        ABUSE = "ABUSE", "Abuse"
        NEGLECT = "NEGLECT", "Neglect"
        EXPLOITATION = "EXPLOITATION", "Exploitation"
        VIOLENCE = "VIOLENCE", "Violence"
        THEFT = "THEFT", "Alleged Theft"
        ASSAULT = "ASSAULT", "Alleged Assault"
        DRUG_RELATED = "DRUG_RELATED", "Drug-related Allegation"
        PROPERTY_DAMAGE = "PROPERTY_DAMAGE", "Alleged Property Damage"
        OTHER = "OTHER", "Other"

    class Status(models.TextChoices):
        NEW = "NEW", "New"
        UNDER_REVIEW = "UNDER_REVIEW", "Under Review"
        ACTIVE = "ACTIVE", "Active"
        CLOSED = "CLOSED", "Closed"
    case_category = models.CharField(
        max_length=30,
        choices=CaseCategory.choices,
    )
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
    def clean(self):
        super().clean()

        child_protection_types = {
            "ABUSE",
            "NEGLECT",
            "EXPLOITATION",
            "VIOLENCE",
            "OTHER",
        }

        conflict_with_law_types = {
            "THEFT",
            "ASSAULT",
            "DRUG_RELATED",
            "PROPERTY_DAMAGE",
            "OTHER",
        }

        if self.case_category == self.CaseCategory.CHILD_PROTECTION:
            allowed_types = child_protection_types

        elif self.case_category == self.CaseCategory.CHILD_IN_CONFLICT_WITH_LAW:
            allowed_types = conflict_with_law_types

        else:
            return

        if self.incident_type not in allowed_types:
            raise ValidationError({
                "incident_type": (
                    "This incident type is not valid for the selected "
                    "case category."
                )
            })
    def __str__(self):
        return str(self.reference_number)
    
    