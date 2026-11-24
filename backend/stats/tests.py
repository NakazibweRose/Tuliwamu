from datetime import date, timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from cases.models import Case
from referrals.models import PublicReport, Referral, ReferralStatusHistory


class StatsTests(APITestCase):
    def setUp(self):
        self.oversight = User.objects.create_user(username="me", password="x", role="OVERSIGHT")
        self.police = User.objects.create_user(username="police", password="x", role="POLICE")
        self.legal = User.objects.create_user(username="legal", password="x", role="LEGAL_AID")

        for _ in range(6):
            PublicReport.objects.create(category="NEGLECT", district="Wakiso", description="fictional")
        for _ in range(2):
            PublicReport.objects.create(category="VIOLENCE", district="Gulu", description="fictional")

        self.case = Case.objects.create(
            case_category="CHILD_PROTECTION",
            child_name="Child E",
            child_age=10,
            incident_type="ABUSE",
            description="Fictional secret description",
            incident_date=date(2026, 11, 1),
            district="Wakiso",
            created_by=self.police,
        )
        referral = Referral.objects.create(
            case=self.case,
            referred_by=self.police,
            receiving_officer=self.legal,
            referring_institution="A",
            receiving_institution="B",
            reason="r",
            status="ACCEPTED",
        )
        Referral.objects.filter(pk=referral.pk).update(
            date_referred=timezone.now() - timedelta(hours=10)
        )
        ReferralStatusHistory.objects.create(
            referral=referral, old_status="PENDING", new_status="ACCEPTED", changed_by=self.legal
        )

    def test_oversight_gets_suppressed_counts(self):
        self.client.force_authenticate(self.oversight)
        response = self.client.get("/api/stats/summary/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        districts = {row["key"]: row["count"] for row in response.data["reports_by_district"]}
        self.assertEqual(districts["Wakiso"], 6)
        self.assertEqual(districts["Gulu"], "<5")
        self.assertEqual(response.data["totals"]["public_reports"], 8)

    def test_acknowledgement_kpi(self):
        self.client.force_authenticate(self.oversight)
        kpis = self.client.get("/api/stats/summary/").data["kpis"]
        self.assertAlmostEqual(kpis["median_hours_to_acknowledge"], 10, delta=0.2)
        self.assertEqual(kpis["percent_acknowledged_within_48h"], 100.0)

    def test_no_identifying_data_in_response(self):
        self.client.force_authenticate(self.oversight)
        body = self.client.get("/api/stats/summary/").content.decode()
        self.assertNotIn("Child E", body)
        self.assertNotIn("secret description", body)
        self.assertNotIn(str(self.case.reference_number), body)

    def test_police_cannot_view_statistics(self):
        self.client.force_authenticate(self.police)
        self.assertEqual(self.client.get("/api/stats/summary/").status_code, status.HTTP_403_FORBIDDEN)
