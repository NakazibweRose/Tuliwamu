
from django.db.models import Q
from rest_framework import serializers

from cases.models import Case
from .models import Referral


class ReferralSerializer(serializers.ModelSerializer):
    case = serializers.PrimaryKeyRelatedField(
        queryset=Case.objects.all(),
        required=True
    )

    case_reference = serializers.UUIDField(
        source="case.reference_number",
        read_only=True
    )

    class Meta:
        model = Referral
        fields = [
            "id",
            "case",
            "case_reference",
            "referring_institution",
            "receiving_institution",
            "reason",
            "status",
            "response_notes",
            "date_referred",
            "date_updated",
        ]
        read_only_fields = [
            "id",
            "case_reference",
            "date_referred",
            "date_updated",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        request = self.context.get("request")

        if request is None:
            return

        user = request.user

        if user.role == "ADMIN":
            return

        if user.role in ["POLICE", "PSWO"]:
            self.fields["case"].queryset = Case.objects.filter(
                Q(created_by=user) |
                Q(assigned_officer=user)
            ).distinct()
        else:
            self.fields["case"].queryset = Case.objects.none()

        self.fields["status"].read_only = True
        self.fields["response_notes"].read_only = True
