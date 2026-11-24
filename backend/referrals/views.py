
from django.db.models import Q
from rest_framework import generics
from rest_framework.permissions import (
    IsAuthenticated,
    BasePermission,
    SAFE_METHODS,
)

from .models import Referral, ReferralStatusHistory
from .serializers import ReferralSerializer
from django.utils import timezone
from .models import Referral, ReferralStatusHistory, ReferralFollowUp
from .serializers import ReferralSerializer, ReferralFollowUpSerializer


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

    def perform_update(self, serializer):
        referral = serializer.instance
        old_status = referral.status

        serializer.save()

        if referral.status != old_status:
            ReferralStatusHistory.objects.create(
                referral=referral,
                old_status=old_status,
                new_status=referral.status,
                changed_by=self.request.user,
                notes=referral.response_notes,
            )


class ReferralFollowUpPermissions(BasePermission):

    def has_permission(self, request, view):
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True

        return (
            request.user.role == "ADMIN"
            or obj.assigned_to_id == request.user.id
        )


class ReferralFollowUpListCreateView(generics.ListCreateAPIView):
    serializer_class = ReferralFollowUpSerializer
    permission_classes = [
        IsAuthenticated,
        ReferralFollowUpPermissions,
    ]

    def get_queryset(self):
        user = self.request.user

        queryset = ReferralFollowUp.objects.select_related(
            "referral",
            "assigned_to",
            "referral__case",
        )

        if user.role == "ADMIN":
            pass
        elif user.role in ["POLICE", "PSWO"]:
            queryset = queryset.filter(
                Q(assigned_to=user)
                | Q(referral__referred_by=user)
                | Q(referral__receiving_officer=user)
                | Q(referral__case__created_by=user)
                | Q(referral__case__assigned_officer=user)
            ).distinct()
        else:
            queryset = queryset.filter(
                Q(assigned_to=user)
                | Q(referral__receiving_officer=user)
            ).distinct()

        if self.request.query_params.get("overdue") == "true":
            queryset = queryset.filter(
                is_completed=False,
                due_date__lt=timezone.localdate(),
            )

        return queryset


class ReferralFollowUpDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = ReferralFollowUpSerializer
    permission_classes = [
        IsAuthenticated,
        ReferralFollowUpPermissions,
    ]

    def get_queryset(self):
        return ReferralFollowUpListCreateView.get_queryset(self)

    def perform_update(self, serializer):
        is_completed = serializer.validated_data.get(
            "is_completed",
            serializer.instance.is_completed,
        )

        completed_at = (
            timezone.now() if is_completed else None
        )

        serializer.save(completed_at=completed_at)

from django.contrib.auth import get_user_model
from rest_framework.response import Response
from rest_framework.views import APIView


User = get_user_model()


class ReferralOfficerListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        officers = User.objects.filter(
            is_active=True,
            role__in=["POLICE", "PSWO", "LEGAL_AID"]
        ).order_by("role", "username")

        data = [
            {
                "id": officer.id,
                "username": officer.username,
                "first_name": officer.first_name,
                "last_name": officer.last_name,
                "role": officer.role,
            }
            for officer in officers
        ]

        return Response(data)