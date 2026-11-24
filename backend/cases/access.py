"""Need-to-know rules for child case records.

- Admins, the officer who registered a case and the assigned officer
  see the full record.
- Someone who has received a referral for a case sees a *minimised*
  record (no name, no description) until they ACCEPT the referral.
- Oversight users never see individual records, only statistics.
"""

from django.db.models import Q

from .models import Case

IDENTITY_REFERRAL_STATUSES = ("ACCEPTED", "IN_PROGRESS", "COMPLETED")


def visible_cases(user):
    if not user or not user.is_authenticated:
        return Case.objects.none()

    if user.role == "ADMIN":
        return Case.objects.all()

    if user.role in ("POLICE", "PSWO", "LEGAL_AID", "SERVICE_PROVIDER"):
        return Case.objects.filter(
            Q(created_by=user)
            | Q(assigned_officer=user)
            | Q(referrals__receiving_officer=user)
        ).distinct()

    return Case.objects.none()


def can_view_identity(user, case):
    if user.role == "ADMIN":
        return True

    if user.id in (case.created_by_id, case.assigned_officer_id):
        return True

    return case.referrals.filter(
        receiving_officer=user,
        status__in=IDENTITY_REFERRAL_STATUSES,
    ).exists()


def can_view_access_log(user, case):
    return user.role == "ADMIN" or user.id in (
        case.created_by_id,
        case.assigned_officer_id,
    )
