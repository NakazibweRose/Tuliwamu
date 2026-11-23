
from django.db.models import Q
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, BasePermission, SAFE_METHODS

from .models import Referral
from .serializers import ReferralSerializer


class IsAdminOrReadOnly(BasePermission):
    """
    Only administrators, Police and PSWO users can create referrals.
    Only administrators can update existing referrals.
    """

    def has_permission(self, request, view):
        role = getattr(request.user, "role", None)

        if request.method in SAFE_METHODS:
            return True

        if request.method == "POST":
            return role in ["ADMIN", "POLICE", "PSWO"]

        return role == "ADMIN"

class ReferralListCreateView(generics.ListCreateAPIView):
    serializer_class = ReferralSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]

    def get_queryset(self):
        user = self.request.user

        queryset = Referral.objects.select_related(
            "case",
            "case__created_by",
            "case__assigned_officer",
        )

        if user.role == "ADMIN":
            return queryset

        if user.role in ["POLICE", "PSWO"]:
            return queryset.filter(
                Q(case__created_by=user) |
                Q(case__assigned_officer=user)
            ).distinct()

        return queryset.none()


class ReferralDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = ReferralSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]

    def get_queryset(self):
        user = self.request.user

        queryset = Referral.objects.select_related(
            "case",
            "case__created_by",
            "case__assigned_officer",
        )

        if user.role == "ADMIN":
            return queryset

        if user.role in ["POLICE", "PSWO"]:
            return queryset.filter(
                Q(case__created_by=user) |
                Q(case__assigned_officer=user)
            ).distinct()

        return queryset.none()
