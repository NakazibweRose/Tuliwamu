from datetime import date

from django.core.cache import cache
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import Institution, User
from audit.models import AuditLog
from cases.models import Case

from .models import PublicReport, Referral


class PublicReportTests(APITestCase):
    def setUp(self):
        cache.clear()  # reset throttling between tests
        self.police = User.objects.create_user(username="police", password="x", role="POLICE")
        self.legal = User.objects.create_user(username="legal", password="x", role="LEGAL_AID")

    def _submit(self, **extra):
        payload = {
            "category": "NEGLECT",
            "district": "Wakiso",
            "description": "Fictional concern",
            **extra,
        }
        return self.client.post("/api/public-reports/", payload)

    def test_anyone_can_submit_without_login(self):
        response = self._submit()
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertTrue(response.data["reference_code"].startswith("TUL-"))
        report = PublicReport.objects.get()
        self.assertEqual(report.channel, "WEB")
        self.assertIsNone(report.contact_phone)

    def test_status_lookup_reveals_status_only(self):
        code = self._submit().data["reference_code"]
        response = self.client.get(f"/api/public-reports/status/{code.lower()}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(set(response.data), {"reference_code", "status", "status_display"})

    def test_public_cannot_list_reports(self):
        self._submit()
        self.assertEqual(self.client.get("/api/public-reports/").status_code, status.HTTP_401_UNAUTHORIZED)

    def test_legal_aid_cannot_triage(self):
        self._submit()
        self.client.force_authenticate(self.legal)
        self.assertEqual(self.client.get("/api/public-reports/").status_code, status.HTTP_403_FORBIDDEN)

    def test_police_can_triage_and_convert_to_case(self):
        self._submit()
        report = PublicReport.objects.get()
        self.client.force_authenticate(self.police)

        self.assertEqual(len(self.client.get("/api/public-reports/").data), 1)

        response = self.client.post(
            f"/api/public-reports/{report.id}/convert/",
            {
                "case_category": "CHILD_PROTECTION",
                "incident_type": "NEGLECT",
                "child_name": "Child C",
                "child_age": 7,
                "incident_date": "2026-11-20",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)

        report.refresh_from_db()
        case = Case.objects.get()
        self.assertEqual(report.case, case)
        self.assertEqual(report.status, "REFERRED")
        self.assertEqual(case.district, "Wakiso")
        self.assertEqual(case.assigned_officer, self.police)
        self.assertTrue(AuditLog.objects.filter(action="CONVERT").exists())

        again = self.client.post(f"/api/public-reports/{report.id}/convert/", {})
        self.assertEqual(again.status_code, status.HTTP_400_BAD_REQUEST)

    def test_convert_validates_category_and_incident_type(self):
        self._submit()
        report = PublicReport.objects.get()
        self.client.force_authenticate(self.police)
        response = self.client.post(
            f"/api/public-reports/{report.id}/convert/",
            {
                "case_category": "CHILD_PROTECTION",
                "incident_type": "THEFT",
                "child_name": "Child C",
                "child_age": 7,
                "incident_date": "2026-11-20",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cannot_set_referred_status_by_hand(self):
        self._submit()
        report = PublicReport.objects.get()
        self.client.force_authenticate(self.police)
        response = self.client.patch(f"/api/public-reports/{report.id}/", {"status": "REFERRED"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        response = self.client.patch(f"/api/public-reports/{report.id}/", {"status": "UNDER_REVIEW"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class ReferralRuleTests(APITestCase):
    def setUp(self):
        self.cfpu = Institution.objects.create(name="Demo CFPU", institution_type="POLICE_CFPU", district="Wakiso")
        self.clinic = Institution.objects.create(name="Demo Legal Clinic", institution_type="LEGAL_AID", district="Wakiso")
        self.police = User.objects.create_user(username="police", password="x", role="POLICE", institution=self.cfpu)
        self.legal = User.objects.create_user(username="legal", password="x", role="LEGAL_AID", institution=self.clinic)
        self.provider = User.objects.create_user(username="shelter", password="x", role="SERVICE_PROVIDER")
        self.case = Case.objects.create(
            case_category="CHILD_PROTECTION",
            child_name="Child D",
            child_age=15,
            incident_type="ABUSE",
            description="Fictional",
            incident_date=date(2026, 11, 3),
            district="Wakiso",
            created_by=self.police,
            assigned_officer=self.police,
        )

    def test_institution_names_filled_from_accounts(self):
        self.client.force_authenticate(self.police)
        response = self.client.post(
            "/api/referrals/",
            {
                "case": self.case.id,
                "receiving_officer": self.legal.id,
                "referring_institution": "typed by hand",
                "receiving_institution": "typed by hand",
                "reason": "Needs legal representation",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(response.data["referring_institution"], "Demo CFPU")
        self.assertEqual(response.data["receiving_institution"], "Demo Legal Clinic")
        self.assertTrue(AuditLog.objects.filter(action="REFER", object_id=self.case.id).exists())

    def test_can_refer_to_service_provider(self):
        self.client.force_authenticate(self.police)
        response = self.client.post(
            "/api/referrals/",
            {
                "case": self.case.id,
                "receiving_officer": self.provider.id,
                "receiving_institution": "Demo Shelter",
                "reason": "Needs safe shelter",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)

    def test_receiver_can_only_change_status_and_notes(self):
        referral = Referral.objects.create(
            case=self.case,
            referred_by=self.police,
            receiving_officer=self.legal,
            referring_institution="Demo CFPU",
            receiving_institution="Demo Legal Clinic",
            reason="Original reason",
        )
        self.client.force_authenticate(self.legal)
        response = self.client.patch(
            f"/api/referrals/{referral.id}/",
            {"status": "ACCEPTED", "reason": "Changed!", "response_notes": "We will help"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        referral.refresh_from_db()
        self.assertEqual(referral.status, "ACCEPTED")
        self.assertEqual(referral.reason, "Original reason")
        self.assertTrue(AuditLog.objects.filter(action="STATUS_CHANGE", object_id=referral.id).exists())

    def test_str_without_case_does_not_crash(self):
        referral = Referral(receiving_institution="X")
        self.assertIn("no case", str(referral))

    def test_officer_list_hidden_from_receivers(self):
        self.client.force_authenticate(self.legal)
        self.assertEqual(self.client.get("/api/referrals/officers/").data, [])
        self.client.force_authenticate(self.police)
        names = [o["username"] for o in self.client.get("/api/referrals/officers/").data]
        self.assertIn("shelter", names)
        self.assertNotIn("police", names)
