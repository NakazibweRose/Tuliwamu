"""Who may see and act on a child-justice journey (need to know).

- Admin: everything.
- Police / PSWO: journeys for cases they registered or are assigned to,
  and (PSWO) journeys where they were notified.
- State Attorney: only files sent to them.
- Court registry: only files sanctioned to their court.
- Legal aid: read-only, through a case referral (identity after accepting).
- Oversight: never individual records, only /api/stats/justice/.
"""

from django.db.models import Q

from cases.access import can_view_identity, visible_cases

from .models import Journey


def visible_journeys(user):
    if not user or not user.is_authenticated:
        return Journey.objects.none()
    qs = Journey.objects.select_related(
        "case", "pswo", "prosecutor", "court", "case__created_by", "case__assigned_officer"
    )
    if user.role == "ADMIN":
        return qs
    if user.role == "PROSECUTOR":
        return qs.filter(prosecutor=user)
    if user.role == "COURT":
        return qs.filter(court=user.institution) if user.institution_id else qs.none()
    if user.role in ("POLICE", "PSWO", "LEGAL_AID"):
        return qs.filter(Q(case__in=visible_cases(user)) | Q(pswo=user)).distinct()
    return qs.none()


def is_police_owner(user, journey):
    case = journey.case
    return user.role == "ADMIN" or (
        user.role == "POLICE" and user.id in (case.created_by_id, case.assigned_officer_id)
    )


def is_pswo(user, journey):
    case = journey.case
    return user.role == "PSWO" and user.id in (
        journey.pswo_id, case.created_by_id, case.assigned_officer_id
    )


def is_prosecutor(user, journey):
    return user.role == "ADMIN" or (user.role == "PROSECUTOR" and journey.prosecutor_id == user.id)


def is_court(user, journey):
    return user.role == "ADMIN" or (
        user.role == "COURT" and user.institution_id and journey.court_id == user.institution_id
    )


def can_see_child_identity(user, journey):
    if user.role in ("ADMIN", "POLICE", "PSWO", "PROSECUTOR", "COURT"):
        return True  # they only ever see journeys they work on
    return can_view_identity(user, journey.case)
