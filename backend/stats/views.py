"""Anonymised, aggregate statistics for oversight and M&E.

Returns counts only, never names, descriptions or record IDs. Any count
from 1 to 4 is returned as "<5" so that individual children cannot be
singled out in small districts or categories (small-cell suppression).
"""

from datetime import timedelta
from statistics import median

from django.db.models import Count
from django.utils import timezone
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from cases.models import Case
from referrals.models import PublicReport, Referral, ReferralFollowUp, ReferralStatusHistory

SUPPRESSION_THRESHOLD = 5
ACK_STATUSES = ("ACCEPTED", "REJECTED")
ACK_TARGET_HOURS = 48
AGE_BAND_ORDER = ["0-5", "6-11", "12-14", "15-17", "18+", "Unknown"]


def suppress(count):
    if 0 < count < SUPPRESSION_THRESHOLD:
        return f"<{SUPPRESSION_THRESHOLD}"
    return count


def grouped(queryset, field, labels=None):
    rows = queryset.values(field).annotate(count=Count("id")).order_by("-count", field)
    return [
        {
            "key": row[field],
            "label": (labels or {}).get(row[field], row[field]),
            "count": suppress(row["count"]),
        }
        for row in rows
    ]


def percent(part, whole):
    return round(100 * part / whole, 1) if whole else None


def acknowledgement_hours():
    """Hours from referral to the receiver's first accept/reject."""
    first_ack = {}
    history = ReferralStatusHistory.objects.filter(new_status__in=ACK_STATUSES).order_by("date_changed")
    for entry in history.values("referral_id", "date_changed"):
        first_ack.setdefault(entry["referral_id"], entry["date_changed"])

    referred = dict(
        Referral.objects.filter(id__in=first_ack).values_list("id", "date_referred")
    )
    return [
        (first_ack[ref_id] - referred_at).total_seconds() / 3600
        for ref_id, referred_at in referred.items()
    ]


class CanViewStatistics(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in ("OVERSIGHT", "ADMIN")
        )


class StatsSummaryView(APIView):
    permission_classes = [IsAuthenticated, CanViewStatistics]

    def get(self, request):
        cases = Case.objects.all()
        referrals = Referral.objects.all()
        reports = PublicReport.objects.all()

        age_bands = {}
        for age in cases.values_list("child_age", flat=True):
            band = Case(child_age=age).age_band
            age_bands[band] = age_bands.get(band, 0) + 1

        hours = acknowledgement_hours()
        referrals_total = referrals.count()
        reports_total = reports.count()

        return Response(
            {
                "generated_at": timezone.now(),
                "suppression_threshold": SUPPRESSION_THRESHOLD,
                "totals": {
                    "public_reports": reports_total,
                    "cases": cases.count(),
                    "referrals": referrals_total,
                },
                "reports_by_district": grouped(reports, "district"),
                "reports_by_channel": grouped(reports, "channel"),
                "reports_by_category": grouped(
                    reports, "category", dict(PublicReport.Category.choices)
                ),
                "cases_by_category": grouped(
                    cases, "case_category", dict(Case.CaseCategory.choices)
                ),
                "cases_by_age_band": [
                    {"key": band, "label": band, "count": suppress(count)}
                    for band, count in sorted(
                        age_bands.items(), key=lambda item: AGE_BAND_ORDER.index(item[0])
                    )
                ],
                "referrals_by_status": grouped(
                    referrals, "status", dict(Referral.ReferralStatus.choices)
                ),
                "referrals_by_receiving_institution": grouped(referrals, "receiving_institution"),
                "kpis": {
                    "median_hours_to_acknowledge": round(median(hours), 1) if hours else None,
                    "percent_acknowledged_within_48h": percent(
                        sum(1 for h in hours if h <= ACK_TARGET_HOURS), referrals_total
                    ),
                    "percent_referrals_completed": percent(
                        referrals.filter(status="COMPLETED").count(), referrals_total
                    ),
                    "percent_reports_converted_to_cases": percent(
                        reports.filter(case__isnull=False).count(), reports_total
                    ),
                    "pending_referrals_older_than_48h": suppress(
                        referrals.filter(
                            status="PENDING",
                            date_referred__lt=timezone.now() - timedelta(hours=ACK_TARGET_HOURS),
                        ).count()
                    ),
                    "overdue_follow_ups": suppress(
                        ReferralFollowUp.objects.filter(
                            is_completed=False, due_date__lt=timezone.localdate()
                        ).count()
                    ),
                },
            }
        )
