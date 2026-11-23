from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):

    def validate(self, attrs):
        data = super().validate(attrs)

        data["role"] = self.user.role

        return data

from rest_framework import serializers
from .models import User


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
        )
        read_only_fields = ("id",)

    def validate_role(self, value):
        allowed_roles = [
            User.Role.POLICE,
            User.Role.PSWO,
            User.Role.LEGAL_AID,
        ]

        if value not in allowed_roles:
            raise serializers.ValidationError(
                "Only Police, PSWO, and Legal Aid accounts can be created here."
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
        fields = ("role",)

    def validate_role(self, value):
        allowed_roles = [
            User.Role.POLICE,
            User.Role.PSWO,
            User.Role.LEGAL_AID,
        ]

        if value not in allowed_roles:
            raise serializers.ValidationError(
                "Only Police, PSWO, and Legal Aid roles are allowed."
            )

        return value