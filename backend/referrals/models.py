
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
