
from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import serializers

from cases.models import Case
from .models import PublicReport, Referral, ReferralFollowUp

User = get_user_model()


class ReferralSerializer(serializers.ModelSerializer):
    case = serializers.PrimaryKeyRelatedField(
        queryset=Case.objects.all(),
        required=True
    )

    receiving_officer = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(
            is_active=True,
            role__in=User.RECEIVER_ROLES,
        ),
        required=True
    )

    receiving_officer_name = serializers.SerializerMethodField()
    referred_by_name = serializers.SerializerMethodField()

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
            "receiving_officer_name",
            "referred_by_name",
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
        # Filled from the officers' institutions when they have one.
        extra_kwargs = {
            "referring_institution": {"required": False},
            "receiving_institution": {"required": False},
        }

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

        # After creation, only an administrator may edit the referral
        # details. The receiving officer may only change status and notes.
        if self.instance is not None and not isinstance(self.instance, (list, tuple)):
            self.fields["case"].read_only = True
            self.fields["receiving_officer"].read_only = True
            if user.role != "ADMIN":
                for name in ("referring_institution", "receiving_institution", "reason"):
                    self.fields[name].read_only = True

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

    @staticmethod
    def _display_name(user):
        if user is None:
            return None
        full_name = user.get_full_name().strip()
        return full_name or user.username

    def get_receiving_officer_name(self, referral):
        return self._display_name(referral.receiving_officer)

    def get_referred_by_name(self, referral):
        return self._display_name(referral.referred_by)

    def validate(self, attrs):
        if self.instance is None:
            # Fill institution names from the officers' institutions so
            # they cannot be mistyped or spoofed.
            request = self.context.get("request")
            receiver = attrs.get("receiving_officer")
            if receiver is not None and receiver.institution_id:
                attrs["receiving_institution"] = receiver.institution.name
            if request is not None and request.user.institution_id:
                attrs["referring_institution"] = request.user.institution.name
            for name in ("referring_institution", "receiving_institution"):
                if not attrs.get(name):
                    raise serializers.ValidationError({name: "This field is required."})
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
            role__in=User.RECEIVER_ROLES,
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


class PublicReportSubmitSerializer(serializers.ModelSerializer):
    """Anonymous web submission. Mirrors the USSD flow."""

    class Meta:
        model = PublicReport
        fields = ("category", "district", "description", "contact_phone", "reference_code", "status")
        read_only_fields = ("reference_code", "status")
        extra_kwargs = {
            "description": {"max_length": 1000},
            "contact_phone": {"required": False, "allow_blank": True},
        }


class PublicReportSerializer(serializers.ModelSerializer):
    """Triage view for Police, PSWOs and admins."""

    category_display = serializers.CharField(source="get_category_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = PublicReport
        fields = (
            "id",
            "reference_code",
            "category",
            "category_display",
            "district",
            "description",
            "contact_phone",
            "channel",
            "status",
            "status_display",
            "case",
            "reviewed_by",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "reference_code",
            "category",
            "district",
            "description",
            "contact_phone",
            "channel",
            "case",
            "reviewed_by",
            "created_at",
            "updated_at",
        )

    def validate_status(self, value):
        if value == PublicReport.ReportStatus.REFERRED:
            raise serializers.ValidationError(
                "Use the convert endpoint to turn a report into a case."
            )
        return value

