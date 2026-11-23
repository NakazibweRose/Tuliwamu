
from datetime import date

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase

from cases.models import Case
from .models import (
    Referral,
    ReferralStatusHistory,
    ReferralFollowUp,
)
User = get_user_model()


class ReferralAPITests(APITestCase):

    def setUp(self):
        self.admin = User.objects.create_user(
            username="admin",
            password="testpass123",
            role="ADMIN",
        )

        self.police = User.objects.create_user(
            username="police",
            password="testpass123",
            role="POLICE",
        )

        self.other_police = User.objects.create_user(
            username="other_police",
            password="testpass123",
            role="POLICE",
        )

        self.legal_aid = User.objects.create_user(
            username="legal_aid",
            password="testpass123",
            role="LEGAL_AID",
        )

        self.case = Case.objects.create(
            case_category="CHILD_PROTECTION",
            child_name="Test Child",
            child_age=12,
            incident_type="ABUSE",
            description="Test case description",
            incident_date=date(2026, 11, 20),
            district="Kampala",
            created_by=self.police,
        )

        self.other_case = Case.objects.create(
            case_category="CHILD_PROTECTION",
            child_name="Another Test Child",
            child_age=14,
            incident_type="NEGLECT",
            description="Another test case",
            incident_date=date(2026, 11, 21),
            district="Wakiso",
            created_by=self.other_police,
        )

        self.referral = Referral.objects.create(
           case=self.case,
           referring_institution="Police",
           receiving_institution="Probation Office",
           receiving_officer=self.legal_aid,
           reason="Follow-up support required",
        )

        self.list_url = reverse("referral-list-create")
        self.detail_url = reverse(
            "referral-detail",
            kwargs={"pk": self.referral.pk},
        )

        self.follow_up_list_url = reverse(
            "follow-up-list-create"
        )

    def test_police_only_sees_own_referrals(self):
        self.client.force_authenticate(user=self.police)

        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

    def test_unrelated_police_cannot_view_referral(self):
        self.client.force_authenticate(user=self.other_police)

        response = self.client.get(self.detail_url)

        self.assertEqual(response.status_code, 404)

    def test_legal_aid_can_view_assigned_referrals(self):
        self.client.force_authenticate(user=self.legal_aid)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

    def test_police_can_create_referral_for_own_case(self):
        self.client.force_authenticate(user=self.police)

        response = self.client.post(
            self.list_url,
            {
                "case": self.case.pk,
                "receiving_officer": self.legal_aid.pk,
                "referring_institution": "Police",
                "receiving_institution": "Legal Aid",
                "reason": "Legal assistance required",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)

    def test_police_cannot_refer_unrelated_case(self):
        self.client.force_authenticate(user=self.police)

        response = self.client.post(
            self.list_url,
            {
                "case": self.other_case.pk,
                "referring_institution": "Police",
                "receiving_institution": "Legal Aid",
                "reason": "Legal assistance required",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    def test_legal_aid_cannot_create_referral(self):
        self.client.force_authenticate(user=self.legal_aid)

        response = self.client.post(
            self.list_url,
            {
                "case": self.case.pk,
                "referring_institution": "Police",
                "receiving_institution": "Legal Aid",
                "reason": "Legal assistance required",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 403)

    def test_police_cannot_update_referral_status(self):
        self.client.force_authenticate(user=self.police)

        response = self.client.patch(
            self.detail_url,
            {"status": "ACCEPTED"},
            format="json",
        )

        self.assertEqual(response.status_code, 403)

    def test_admin_can_update_referral_status(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.patch(
            self.detail_url,
            {"status": "ACCEPTED"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)

        self.referral.refresh_from_db()
        self.assertEqual(self.referral.status, "ACCEPTED")

        history = ReferralStatusHistory.objects.get(referral=self.referral)

        self.assertEqual(history.old_status, "PENDING")
        self.assertEqual(history.new_status, "ACCEPTED")
        self.assertEqual(history.changed_by, self.admin)

    def test_receiving_officer_can_accept_referral(self):
        self.client.force_authenticate(user=self.legal_aid)

        response = self.client.patch(
            self.detail_url,
            {"status": "ACCEPTED"},
            format="json",
       )

        self.assertEqual(response.status_code, 200)

        self.referral.refresh_from_db()
        self.assertEqual(self.referral.status, "ACCEPTED")

        history = ReferralStatusHistory.objects.get(referral=self.referral)

        self.assertEqual(history.old_status, "PENDING")
        self.assertEqual(history.new_status, "ACCEPTED")
        self.assertEqual(history.changed_by, self.legal_aid)

    def test_police_can_create_follow_up(self):
        self.client.force_authenticate(user=self.police)

        response = self.client.post(
            self.follow_up_list_url,
            {
                "referral": self.referral.pk,
                "assigned_to": self.legal_aid.pk,
                "due_date": "2030-01-01",
                "notes": "Check on referral progress",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(
            ReferralFollowUp.objects.count(),
            1,
        )

    def test_unrelated_police_cannot_view_follow_up(self):
        follow_up = ReferralFollowUp.objects.create(
            referral=self.referral,
            assigned_to=self.legal_aid,
            due_date=date(2030, 1, 1),
            notes="Follow-up task",
        )

        self.client.force_authenticate(user=self.other_police)

        url = reverse(
            "follow-up-detail",
            kwargs={"pk": follow_up.pk},
        )

        response = self.client.get(url)

        self.assertEqual(response.status_code, 404)

    def test_assigned_officer_can_complete_follow_up(self):
        follow_up = ReferralFollowUp.objects.create(
            referral=self.referral,
            assigned_to=self.legal_aid,
            due_date=date(2030, 1, 1),
            notes="Follow-up task",
        )

        self.client.force_authenticate(user=self.legal_aid)

        url = reverse(
            "follow-up-detail",
            kwargs={"pk": follow_up.pk},
        )

        response = self.client.patch(
            url,
            {"is_completed": True},
            format="json",
        )

        self.assertEqual(response.status_code, 200)

        follow_up.refresh_from_db()

        self.assertTrue(follow_up.is_completed)
        self.assertIsNotNone(follow_up.completed_at)

    def test_admin_can_filter_overdue_follow_ups(self):
        overdue_follow_up = ReferralFollowUp.objects.create(
            referral=self.referral,
            assigned_to=self.legal_aid,
            due_date=date(2020, 1, 1),
            notes="Overdue task",
        )

        self.client.force_authenticate(user=self.admin)

        response = self.client.get(
            self.follow_up_list_url,
            {"overdue": "true"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(
            response.data[0]["id"],
            overdue_follow_up.pk,
        )
