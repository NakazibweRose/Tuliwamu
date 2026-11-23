from rest_framework import serializers
from .models import Case, CommunityReport


class CaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Case
        fields = "__all__"
        read_only_fields = (
            "id",
            "reference_number",
            "created_by",
            "created_at",
            "updated_at",
        )

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



class CommunityReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommunityReport
        fields = "__all__"
        read_only_fields = (
            "id",
            "reference_number",
            "reporter",
            "child",
            "linked_case",
            "status",
            "created_at",
            "updated_at",
        )
class CommunityReportReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommunityReport
        fields = ("status",)