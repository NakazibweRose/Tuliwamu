from django.contrib.auth.models import AbstractUser, UserManager
from django.db import models


class Institution(models.Model):
    """An organisation that sends or receives child-sensitive referrals."""

    class InstitutionType(models.TextChoices):
        POLICE_CFPU = "POLICE_CFPU", "Police Child & Family Protection Unit"
        PROBATION_OFFICE = "PROBATION_OFFICE", "Probation & Social Welfare Office"
        LEGAL_AID = "LEGAL_AID", "Legal Aid Provider"
        SERVICE_PROVIDER = "SERVICE_PROVIDER", "Support Service (health, shelter, psychosocial)"
        PROSECUTION = "PROSECUTION", "Office of the Director of Public Prosecutions"
        COURT = "COURT", "Family and Children Court / Magistrates Court"
        OVERSIGHT = "OVERSIGHT", "Oversight / Monitoring & Evaluation"
        OTHER = "OTHER", "Other"

    name = models.CharField(max_length=150, unique=True)
    institution_type = models.CharField(
        max_length=30,
        choices=InstitutionType.choices,
    )
    district = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=20, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class TuliwamuUserManager(UserManager):
    def create_superuser(self, username, email=None, password=None, **extra_fields):
        extra_fields.setdefault("role", User.Role.ADMIN)
        return super().create_superuser(username, email, password, **extra_fields)


class User(AbstractUser):

    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Administrator"
        POLICE = "POLICE", "Police Officer (CFPU)"
        PSWO = "PSWO", "Probation and Social Welfare Officer"
        LEGAL_AID = "LEGAL_AID", "Legal Aid Provider"
        SERVICE_PROVIDER = "SERVICE_PROVIDER", "Support Service Provider"
        PROSECUTOR = "PROSECUTOR", "State Attorney (ODPP)"
        COURT = "COURT", "Court Registry (Family and Children Court)"
        OVERSIGHT = "OVERSIGHT", "Oversight / M&E (anonymised statistics only)"

    # Roles that register cases and make referrals.
    INTAKE_ROLES = (Role.POLICE, Role.PSWO)
    # Roles that receive referrals and provide services.
    RECEIVER_ROLES = (Role.POLICE, Role.PSWO, Role.LEGAL_AID, Role.SERVICE_PROVIDER)
    # Roles an administrator may create or switch staff accounts to.
    STAFF_ROLES = (
        Role.POLICE,
        Role.PSWO,
        Role.LEGAL_AID,
        Role.SERVICE_PROVIDER,
        Role.PROSECUTOR,
        Role.COURT,
        Role.OVERSIGHT,
    )

    # No default: an account without an explicit role gets no access.
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
    )

    institution = models.ForeignKey(
        Institution,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="staff",
    )

    # Used only for SMS alerts. Messages never contain child details.
    phone_number = models.CharField(max_length=20, blank=True)

    objects = TuliwamuUserManager()

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
