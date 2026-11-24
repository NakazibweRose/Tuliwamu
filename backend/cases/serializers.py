from rest_framework import serializers
from .access import can_view_identity
from .models import Case


class CaseSerializer(serializers.ModelSerializer):
    """Full case record. Downgrades to a minimised record (no name, no
    description) for users who may not see the child's identity."""

    age_band = serializers.CharField(read_only=True)
    identity_visible = serializers.SerializerMethodField()

    class Meta:
        model = Case
        fields = (
            "id",
            "reference_number",
            "case_category",
            "incident_type",
            "child_name",
            "child_age",
            "age_band",
            "description",
            "incident_date",
            "district",
            "status",
            "assigned_officer",
            "created_by",
            "created_at",
            "updated_at",
            "identity_visible",
        )
        read_only_fields = (
            "id",
            "reference_number",
            "created_by",
            "created_at",
            "updated_at",
        )

    MINIMISED_FIELDS = (
        "id",
        "reference_number",
        "case_category",
        "incident_type",
        "age_band",
        "district",
        "status",
        "created_at",
        "identity_visible",
    )

    def _identity_visible(self, case):
        request = self.context.get("request")
        if request is None:
            return True
        return can_view_identity(request.user, case)

    def get_identity_visible(self, case):
        return self._identity_visible(case)

    def to_representation(self, case):
        data = super().to_representation(case)
        if data.get("identity_visible"):
            return data
        return {key: data[key] for key in self.MINIMISED_FIELDS}

    def validate(self, attrs):
        case_category = attrs.get(
            "case_category",
            getattr(self.instance, "case_category", None),
        )

        incident_type = attrs.get(
            "incident_type",
            getattr(self.instance, "incident_type", None),
            
        )
        assigned_officer = attrs.get(
            "assigned_officer",
            getattr(self.instance, "assigned_officer", None),
        )

        if assigned_officer and assigned_officer.role not in (
            "POLICE",
            "PSWO",
        ):
            raise serializers.ValidationError({
                "assigned_officer": (
                    "A case can only be assigned to a Police Officer "
                    "or a PSWO."
                )
            })

        child_protection_types = {
            "ABUSE",
            "NEGLECT",
            "EXPLOITATION",
            "VIOLENCE",
            "OTHER",
        }

        conflict_with_law_types = {
            "THEFT",
            "ASSAULT",
            "DRUG_RELATED",
            "PROPERTY_DAMAGE",
            "OTHER",
        }

        if case_category == Case.CaseCategory.CHILD_PROTECTION:
            allowed_types = child_protection_types

        elif case_category == Case.CaseCategory.CHILD_IN_CONFLICT_WITH_LAW:
            allowed_types = conflict_with_law_types

        else:
            return attrs

        if incident_type not in allowed_types:
            raise serializers.ValidationError({
                "incident_type": (
                    "This incident type is not valid for the selected "
                    "case category."
                )
            })

        return attrs


class CaseStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Case
        fields = ("status",)

class CaseAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Case
        fields = ("assigned_officer",)

    def validate_assigned_officer(self, value):
        if value.role not in ("POLICE", "PSWO"):
            raise serializers.ValidationError(
                "Cases can only be assigned to Police Officers or PSWOs."
            )
        return value
