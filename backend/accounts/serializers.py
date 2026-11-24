from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Institution, User


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):

    def validate(self, attrs):
        data = super().validate(attrs)

        data["role"] = self.user.role
        data["institution"] = (
            self.user.institution.name if self.user.institution else None
        )

        return data


class CommunityRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "password",
        )
        read_only_fields = ("id",)

    def create(self, validated_data):
        return User.objects.create_user(
            **validated_data,
            role=User.Role.COMMUNITY,
        )

class StaffAccountCreationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "password",
            "role",
            "institution",
            "phone_number",
        )
        read_only_fields = ("id",)

    def validate_role(self, value):
        allowed_roles = User.STAFF_ROLES

        if value not in allowed_roles:
            raise serializers.ValidationError(
                "Only staff roles can be created here."
            )

        return value

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)

class StaffAccountListSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "institution",
            "phone_number",
            "is_active",
        )
        read_only_fields = fields

class StaffAccountStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("is_active",)

    def validate(self, attrs):
        if self.instance.role in (User.Role.ADMIN, User.Role.COMMUNITY):
            raise serializers.ValidationError(
                "This endpoint only manages staff accounts."
            )

        return attrs

class StaffRoleUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("role", "institution")

    def validate_role(self, value):
        allowed_roles = User.STAFF_ROLES

        if value not in allowed_roles:
            raise serializers.ValidationError(
                "Only staff roles are allowed."
            )

        return value


class InstitutionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Institution
        fields = (
            "id",
            "name",
            "institution_type",
            "district",
            "phone_number",
            "is_active",
        )
        read_only_fields = ("id",)
