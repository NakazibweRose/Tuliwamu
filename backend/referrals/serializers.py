
from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import serializers

from cases.models import Case
from .models import Referral, ReferralFollowUp

User = get_user_model()


class ReferralSerializer(serializers.ModelSerializer):
    case = serializers.PrimaryKeyRelatedField(
        queryset=Case.objects.all(),
        required=True
    )

    receiving_officer = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(
            is_active=True,
            role__in=["POLICE", "PSWO", "LEGAL_AID"]
        ),
        required=True
    )

    case_reference = serializers.UUIDField(
        source="case.reference_number",
        read_only=True
    )

    referred_by = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Referral
        fields = [
            "id",
            "case",
            "case_reference",
            "referred_by",
            "receiving_officer",
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
            "referred_by",
            "date_referred",
            "date_updated",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        request = self.context.get("request")

        if request is None:
            return

        user = request.user

        if user.role != "ADMIN":
            if user.role in ["POLICE", "PSWO"]:
                self.fields["case"].queryset = Case.objects.filter(
                    Q(created_by=user) |
                    Q(assigned_officer=user)
                ).distinct()
            else:
                self.fields["case"].queryset = Case.objects.none()

        # Do not allow changing the case or recipient after creation.
        if self.instance:
            self.fields["case"].read_only = True
            self.fields["receiving_officer"].read_only = True

        # Only an administrator or the assigned receiving officer
        # can update status and response notes.
        is_recipient = (
    self.instance is not None
    and not isinstance(self.instance, (list, tuple))
    and getattr(self.instance, "receiving_officer_id", None) == user.id
)

        if self.instance is None or (
            user.role != "ADMIN" and not is_recipient
        ):
            self.fields["status"].read_only = True
            self.fields["response_notes"].read_only = True

    def validate(self, attrs):
        if self.instance is None:
            return attrs

        new_status = attrs.get("status")
        if new_status is None:
            return attrs

        current_status = self.instance.status

        allowed_transitions = {
            "PENDING": ["ACCEPTED", "REJECTED"],
            "ACCEPTED": ["IN_PROGRESS"],
            "IN_PROGRESS": ["COMPLETED"],
            "COMPLETED": [],
            "REJECTED": [],
        }

        if new_status != current_status and new_status not in allowed_transitions.get(
            current_status, []
        ):
            raise serializers.ValidationError({
                "status": "This status transition is not allowed."
            })

        if new_status == "REJECTED":
            notes = attrs.get(
                "response_notes",
                self.instance.response_notes
            )
            if not notes.strip():
                raise serializers.ValidationError({
                    "response_notes": "A reason is required when rejecting a referral."
                })

        return attrs

class ReferralFollowUpSerializer(serializers.ModelSerializer):
    assigned_to = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(
            is_active=True,
            role__in=["POLICE", "PSWO", "LEGAL_AID"]
        )
    )

    class Meta:
        model = ReferralFollowUp
        fields = [
            "id",
            "referral",
            "assigned_to",
            "due_date",
            "notes",
            "is_completed",
            "completed_at",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "completed_at",
            "created_at",
        ]

    def validate_referral(self, referral):
        request = self.context.get("request")

        if request is None:
            return referral

        user = request.user

        if user.role == "ADMIN":
            return referral

        if (
            referral.referred_by_id == user.id
            or referral.receiving_officer_id == user.id
            or referral.case.created_by_id == user.id
            or referral.case.assigned_officer_id == user.id
        ):
            return referral

        raise serializers.ValidationError(
            "You do not have permission to create a follow-up for this referral."
        )