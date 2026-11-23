
from django.db.models import Q
from rest_framework import generics
from rest_framework.permissions import (
    IsAuthenticated,
    BasePermission,
    SAFE_METHODS,
)

from .models import Referral
from .serializers import ReferralSerializer


class ReferralPermissions(BasePermission):
    """
    Only authorized roles can create referrals.
    Only administrators or assigned receiving officers can update them.
    """

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True

        if request.method == "POST":
            return getattr(request.user, "role", None) in [
                "ADMIN", "POLICE", "PSWO"
            ]

        return True

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True

        return (
            request.user.role == "ADMIN"
            or obj.receiving_officer_id == request.user.id
        )


class ReferralListCreateView(generics.ListCreateAPIView):
    serializer_class = ReferralSerializer
    permission_classes = [IsAuthenticated, ReferralPermissions]

    def get_queryset(self):
        user = self.request.user

        queryset = Referral.objects.select_related(
            "case",
            "referred_by",
            "receiving_officer",
            "case__created_by",
            "case__assigned_officer",
        )

        if user.role == "ADMIN":
            return queryset

        if user.role in ["POLICE", "PSWO"]:
            return queryset.filter(
                Q(referred_by=user) |
                Q(receiving_officer=user) |
                Q(case__created_by=user) |
                Q(case__assigned_officer=user)
            ).distinct()

        return queryset.filter(receiving_officer=user)

    def perform_create(self, serializer):
        serializer.save(referred_by=self.request.user)


class ReferralDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = ReferralSerializer
    permission_classes = [IsAuthenticated, ReferralPermissions]

    def get_queryset(self):
        user = self.request.user

        queryset = Referral.objects.select_related(
            "case",
            "referred_by",
            "receiving_officer",
            "case__created_by",
            "case__assigned_officer",
        )

        if user.role == "ADMIN":
            return queryset

        if user.role in ["POLICE", "PSWO"]:
            return queryset.filter(
                Q(referred_by=user) |
                Q(receiving_officer=user) |
                Q(case__created_by=user) |
                Q(case__assigned_officer=user)
            ).distinct()

        return queryset.filter(receiving_officer=user)
