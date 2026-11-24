import uuid

from django.conf import settings
from django.db import models
from django.core.exceptions import ValidationError



class Child(models.Model):
    name = models.CharField(max_length=150, blank=True)

    date_of_birth = models.DateField(
        null=True,
        blank=True,
    )

    estimated_age = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
    )

    district = models.CharField(
        max_length=100,
        blank=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name or f"Child record #{self.pk}"

class ChildRelationship(models.Model):

    class RelationshipType(models.TextChoices):
        PARENT = "PARENT", "Parent"
        LEGAL_GUARDIAN = "LEGAL_GUARDIAN", "Legal Guardian"
        CAREGIVER = "CAREGIVER", "Caregiver"
        OTHER = "OTHER", "Other Authorized Representative"

    class VerificationStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        VERIFIED = "VERIFIED", "Verified"
        REJECTED = "REJECTED", "Rejected"
        REVOKED = "REVOKED", "Revoked"

    child = models.ForeignKey(
        Child,
        on_delete=models.CASCADE,
        related_name="relationships",
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="child_relationships",
    )

    relationship_type = models.CharField(
        max_length=20,
        choices=RelationshipType.choices,
    )

    verification_status = models.CharField(
        max_length=20,
        choices=VerificationStatus.choices,
        default=VerificationStatus.PENDING,
    )

    access_granted = models.BooleanField(default=False)

    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="verified_child_relationships",
    )

    verified_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    def clean(self):
        super().clean()

        if self.verified_by and self.verified_by.role not in (
            "ADMIN",
            "POLICE",
            "PSWO",
        ):
            raise ValidationError({
                "verified_by": (
                    "Only an Administrator, Police Officer, "
                    "or PSWO can verify a child relationship."
                )
            })

        if self.access_granted and (
            self.verification_status != self.VerificationStatus.VERIFIED
        ):
            raise ValidationError({
                "access_granted": (
                    "Access can only be granted after the relationship "
                    "has been verified."
                )
            })

        if self.verification_status == self.VerificationStatus.VERIFIED:
            if not self.verified_by or not self.verified_at:
                raise ValidationError(
                    "A verified relationship must record who verified it "
                    "and when."
                )
    def __str__(self):
        return f"{self.user} - {self.child} ({self.relationship_type})"



class CommunityReport(models.Model):

    class ReportType(models.TextChoices):
        MISSING_CHILD = "MISSING_CHILD", "Missing Child"
        CHILD_PROTECTION = "CHILD_PROTECTION", "Child Protection Concern"
        OTHER = "OTHER", "Other Concern"

    class Status(models.TextChoices):
        RECEIVED = "RECEIVED", "Received"
        UNDER_REVIEW = "UNDER_REVIEW", "Under Review"
        LINKED_TO_CASE = "LINKED_TO_CASE", "Linked to Case"
        CLOSED = "CLOSED", "Closed"

    reference_number = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False,
    )

    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="community_reports",
    )

    report_type = models.CharField(
        max_length=30,
        choices=ReportType.choices,
    )

    reported_child_name = models.CharField(max_length=150)
    reported_child_age = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
    )

    description = models.TextField()
    district = models.CharField(max_length=100)

    last_seen_location = models.CharField(
        max_length=255,
        blank=True,
    )

    last_seen_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    child = models.ForeignKey(
        Child,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="community_reports",
    )

    linked_case = models.ForeignKey(
        "Case",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="community_reports",
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.RECEIVED,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return str(self.reference_number)

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
    child = models.ForeignKey(
    Child,
    on_delete=models.PROTECT,
    null=True,
    blank=True,
    related_name="cases",
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

        if self.assigned_officer and self.assigned_officer.role not in (
            "POLICE",
            "PSWO",
        ):
            raise ValidationError({
                "assigned_officer": (
                    "A case can only be assigned to a Police Officer "
                    "or a PSWO."
                )
            })

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
    
    