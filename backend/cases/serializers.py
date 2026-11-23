from rest_framework import serializers
from .models import Case, CommunityReport, ChildRelationship


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
        fields = ("status", "child", "linked_case")

    def validate(self, attrs):
        status = attrs.get("status", self.instance.status)
        child = attrs.get("child", self.instance.child)
        linked_case = attrs.get("linked_case", self.instance.linked_case)

        if status == CommunityReport.Status.LINKED_TO_CASE:
            if not child or not linked_case:
                raise serializers.ValidationError(
                    "A child and an official case are required when linking a report."
                )

            if linked_case.child_id != child.id:
                raise serializers.ValidationError(
                    "The selected official case must belong to the selected child."
                )

        return attrs




class ChildRelationshipSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChildRelationship
        fields = "__all__"
        read_only_fields = (
            "id",
            "user",
            "verification_status",
            "access_granted",
            "verified_by",
            "verified_at",
            "created_at",
        )

class ChildRelationshipVerificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChildRelationship
        fields = ("verification_status", "access_granted")

    def validate(self, attrs):
        status = attrs.get(
            "verification_status",
            self.instance.verification_status,
        )
        access_granted = attrs.get(
            "access_granted",
            self.instance.access_granted,
        )

        if status not in ("VERIFIED", "REJECTED"):
            raise serializers.ValidationError(
                "A request can only be verified or rejected through this endpoint."
            )

        if access_granted and status != "VERIFIED":
            raise serializers.ValidationError({
                "access_granted": "Access requires a verified relationship."
            })

        if status == "REJECTED" and access_granted:
            raise serializers.ValidationError({
                "access_granted": "Rejected relationships cannot receive access."
            })

        return attrs


class GuardianCaseSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Case
        fields = (
            "reference_number",
            "case_category",
            "status",
            "incident_date",
            "district",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields
