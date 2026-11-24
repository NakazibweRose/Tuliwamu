from datetime import date

from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from audit.models import AuditLog
from referrals.models import Referral

from .models import Case


class NeedToKnowTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(username="admin", password="x", role="ADMIN")
        self.police = User.objects.create_user(username="police", password="x", role="POLICE")
        self.other_police = User.objects.create_user(username="police2", password="x", role="POLICE")
        self.legal = User.objects.create_user(username="legal", password="x", role="LEGAL_AID")
        self.oversight = User.objects.create_user(username="oversight", password="x", role="OVERSIGHT")

        self.case = Case.objects.create(
            case_category="CHILD_PROTECTION",
            child_name="Child A",
            child_age=13,
            incident_type="NEGLECT",
            description="Fictional description",
            incident_date=date(2026, 11, 1),
            district="Wakiso",
            created_by=self.police,
            assigned_officer=self.police,
        )
        self.referral = Referral.objects.create(
            case=self.case,
            referred_by=self.police,
            receiving_officer=self.legal,
            referring_institution="Demo CFPU",
            receiving_institution="Demo Legal Aid",
            reason="Needs legal representation",
        )
        self.url = f"/api/cases/{self.case.id}/"

    def test_registering_officer_sees_full_record(self):
        self.client.force_authenticate(self.police)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["child_name"], "Child A")
        self.assertTrue(response.data["identity_visible"])

    def test_receiver_sees_minimised_record_before_accepting(self):
        self.client.force_authenticate(self.legal)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn("child_name", response.data)
        self.assertNotIn("description", response.data)
        self.assertEqual(response.data["age_band"], "12-14")
        self.assertFalse(response.data["identity_visible"])

    def test_receiver_sees_identity_after_accepting(self):
        self.referral.status = "ACCEPTED"
        self.referral.save()
        self.client.force_authenticate(self.legal)
        response = self.client.get(self.url)
        self.assertEqual(response.data["child_name"], "Child A")

    def test_unrelated_officer_cannot_see_case(self):
        self.client.force_authenticate(self.other_police)
        self.assertEqual(self.client.get(self.url).status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(len(self.client.get("/api/cases/").data), 0)

    def test_oversight_cannot_see_individual_cases(self):
        self.client.force_authenticate(self.oversight)
        self.assertEqual(self.client.get("/api/cases/").status_code, status.HTTP_403_FORBIDDEN)

    def test_receiver_cannot_search_by_child_name(self):
        self.client.force_authenticate(self.legal)
        response = self.client.get("/api/cases/", {"search": "Child A"})
        self.assertEqual(len(response.data), 0)

    def test_legal_aid_cannot_register_case(self):
        self.client.force_authenticate(self.legal)
        response = self.client.post("/api/cases/", {})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class AuditLogTests(APITestCase):
    def setUp(self):
        self.police = User.objects.create_user(username="police", password="x", role="POLICE")
        self.legal = User.objects.create_user(username="legal", password="x", role="LEGAL_AID")
        self.client.force_authenticate(self.police)

    def _create_case(self):
        response = self.client.post(
            "/api/cases/",
            {
                "case_category": "CHILD_PROTECTION",
                "child_name": "Child B",
                "child_age": 9,
                "incident_type": "ABUSE",
                "description": "Fictional",
                "incident_date": "2026-11-02",
                "district": "Gulu",
                "assigned_officer": self.police.id,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        return response.data["id"]

    def test_create_and_view_are_logged(self):
        case_id = self._create_case()
        self.client.get(f"/api/cases/{case_id}/")
        actions = list(
            AuditLog.objects.filter(object_id=case_id).values_list("action", flat=True)
        )
        self.assertIn("CREATE", actions)
        self.assertIn("VIEW", actions)

    def test_audit_detail_never_contains_child_name(self):
        case_id = self._create_case()
        self.client.get(f"/api/cases/{case_id}/")
        self.assertFalse(AuditLog.objects.filter(detail__icontains="Child B").exists())

    def test_assigned_officer_can_read_access_log(self):
        case_id = self._create_case()
        self.client.get(f"/api/cases/{case_id}/")
        response = self.client.get(f"/api/cases/{case_id}/access-log/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 2)

    def test_receiver_cannot_read_access_log(self):
        case_id = self._create_case()
        Referral.objects.create(
            case_id=case_id,
            referred_by=self.police,
            receiving_officer=self.legal,
            referring_institution="A",
            receiving_institution="B",
            reason="r",
        )
        self.client.force_authenticate(self.legal)
        response = self.client.get(f"/api/cases/{case_id}/access-log/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class SuperuserRoleTests(APITestCase):
    def test_createsuperuser_gets_admin_role(self):
        user = User.objects.create_superuser("root", "root@example.com", "x")
        self.assertEqual(user.role, "ADMIN")

    def test_user_without_role_has_no_case_access(self):
        user = User.objects.create_user(username="norole", password="x")
        self.client.force_authenticate(user)
        self.assertEqual(self.client.get("/api/cases/").status_code, status.HTTP_403_FORBIDDEN)


class SeedDemoTests(APITestCase):
    def test_seed_demo_runs_twice(self):
        from django.core.management import call_command

        call_command("seed_demo", stdout=open("/dev/null", "w"))
        call_command("seed_demo", "--reset", stdout=open("/dev/null", "w"))
        self.assertEqual(User.objects.filter(role="OVERSIGHT").count(), 1)
        self.assertEqual(Case.objects.count(), 8)
