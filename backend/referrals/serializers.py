from rest_framework import serializers
from cases.models import Case
from .models import Referral


class ReferralSerializer(serializers.ModelSerializer):
    case = serializers.PrimaryKeyRelatedField(
        queryset=Case.objects.all(),
        required=True
    )

    case_reference = serializers.UUIDField(
        source='case.reference_number',
        read_only=True
    )

    class Meta:
        model = Referral
        fields = [
            'id',
            'case',
            'case_reference',
            'referring_institution',
            'receiving_institution',
            'reason',
            'status',
            'response_notes',
            'date_referred',
            'date_updated',
        ]
        read_only_fields = [
            'id',
            'case_reference',
            'date_referred',
            'date_updated',
        ]