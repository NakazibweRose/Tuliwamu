from rest_framework import serializers

from .models import Case


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


class CaseStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Case
        fields = ("status",)