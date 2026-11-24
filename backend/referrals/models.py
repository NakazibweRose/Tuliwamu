import secrets
from django.conf import settings
from django.db import models


class Referral(models.Model):

    class ReferralStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        ACCEPTED = "ACCEPTED", "Accepted"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        COMPLETED = "COMPLETED", "Completed"
        REJECTED = "REJECTED", "Rejected"

    case = models.ForeignKey(
        "cases.Case",
        on_delete=models.PROTECT,
        related_name="referrals",
        null=True,
        blank=True,
    )

    referred_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="sent_referrals",
        null=True,
        blank=True,
    )

    receiving_officer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="received_referrals",
        null=True,
        blank=True,
    )

    referring_institution = models.CharField(max_length=150)
    receiving_institution = models.CharField(max_length=150)

    reason = models.TextField()

    status = models.CharField(
        max_length=20,
        choices=ReferralStatus.choices,
        default=ReferralStatus.PENDING,
    )

    response_notes = models.TextField(blank=True)

    date_referred = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date_referred"]

    def __str__(self):
        return f"{self.case.reference_number} - {self.receiving_institution}"


class ReferralStatusHistory(models.Model):
    referral = models.ForeignKey(
        Referral,
        on_delete=models.CASCADE,
        related_name="status_history",
    )

    old_status = models.CharField(
        max_length=20,
        choices=Referral.ReferralStatus.choices,
    )

    new_status = models.CharField(
        max_length=20,
        choices=Referral.ReferralStatus.choices,
    )

    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="referral_status_changes",
    )

    notes = models.TextField(blank=True)
    date_changed = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date_changed"]

    def __str__(self):
        return f"{self.referral_id}: {self.old_status} → {self.new_status}"

class ReferralFollowUp(models.Model):
    referral = models.ForeignKey(
        Referral,
        on_delete=models.CASCADE,
        related_name="follow_ups",
    )

    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="referral_follow_ups",
    )

    due_date = models.DateField()

    notes = models.TextField(blank=True)

    is_completed = models.BooleanField(default=False)

    completed_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["due_date"]

    def __str__(self):
        return f"Follow-up for referral {self.referral_id}"



def generate_report_reference():
    return f"TUL-{secrets.token_hex(6).upper()}"


class PublicReport(models.Model):
    class Category(models.TextChoices):
        PROTECTION = "PROTECTION", "Child protection concern"
        NEGLECT = "NEGLECT", "Neglect"
        VIOLENCE = "VIOLENCE", "Violence or abuse"
        OTHER = "OTHER", "Other"

    class ReportStatus(models.TextChoices):
        RECEIVED = "RECEIVED", "Received"
        UNDER_REVIEW = "UNDER_REVIEW", "Under Review"
        REFERRED = "REFERRED", "Referred"
        CLOSED = "CLOSED", "Closed"

    reference_code = models.CharField(
        max_length=16,
        unique=True,
        default=generate_report_reference,
        editable=False,
    )
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
    )
    district = models.CharField(max_length=100)
    description = models.TextField()
    contact_phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
    )
    status = models.CharField(
        max_length=20,
        choices=ReportStatus.choices,
        default=ReportStatus.RECEIVED,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.reference_code} - {self.get_category_display()}"


class Station(models.Model):
    name = models.CharField(max_length=150)
    phone_number = models.CharField(max_length=20, unique=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name
