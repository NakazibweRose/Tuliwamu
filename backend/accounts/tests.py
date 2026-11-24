from rest_framework import status
from rest_framework.test import APITestCase

from .models import Institution, User


class InstitutionAndRoleTests(APITestCase):
    def setUp(self):
        self.cfpu = Institution.objects.create(
            name="Demo CFPU Wakiso",
            institution_type=Institution.InstitutionType.POLICE_CFPU,
            district="Wakiso",
        )
        self.admin = User.objects.create_user(
            username="admin1", password="pass12345", role=User.Role.ADMIN
        )
        self.police = User.objects.create_user(
            username="police1",
            password="pass12345",
            role=User.Role.POLICE,
            institution=self.cfpu,
            phone_number="+256700000001",
        )

    def test_profile_includes_institution_and_phone(self):
        self.client.force_authenticate(self.police)
        response = self.client.get("/api/accounts/profile/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["institution"]["name"], "Demo CFPU Wakiso")
        self.assertEqual(response.data["phone_number"], "+256700000001")

    def test_token_response_includes_role(self):
        response = self.client.post(
            "/api/token/", {"username": "police1", "password": "pass12345"}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["role"], "POLICE")
        self.assertEqual(response.data["institution"], "Demo CFPU Wakiso")

    def test_staff_can_list_institutions(self):
        self.client.force_authenticate(self.police)
        response = self.client.get("/api/accounts/institutions/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_only_admin_can_create_institution(self):
        payload = {
            "name": "Demo Legal Aid Clinic",
            "institution_type": "LEGAL_AID",
            "district": "Kampala",
        }
        self.client.force_authenticate(self.police)
        self.assertEqual(
            self.client.post("/api/accounts/institutions/", payload).status_code,
            status.HTTP_403_FORBIDDEN,
        )
        self.client.force_authenticate(self.admin)
        self.assertEqual(
            self.client.post("/api/accounts/institutions/", payload).status_code,
            status.HTTP_201_CREATED,
        )

    def test_admin_can_create_new_staff_roles(self):
        self.client.force_authenticate(self.admin)
        for role in ("SERVICE_PROVIDER", "OVERSIGHT"):
            response = self.client.post(
                "/api/accounts/staff/",
                {
                    "username": f"user_{role.lower()}",
                    "password": "pass12345",
                    "role": role,
                    "institution": self.cfpu.id,
                },
            )
            self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)

    def test_admin_cannot_create_admin_via_staff_endpoint(self):
        self.client.force_authenticate(self.admin)
        response = self.client.post(
            "/api/accounts/staff/",
            {"username": "sneaky", "password": "pass12345", "role": "ADMIN"},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
