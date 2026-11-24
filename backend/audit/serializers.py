from rest_framework import serializers

from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    user = serializers.CharField(source="user.username", default=None)
    user_role = serializers.CharField(source="user.role", default=None)

    class Meta:
        model = AuditLog
        fields = ("id", "user", "user_role", "action", "detail", "created_at")
        read_only_fields = fields
