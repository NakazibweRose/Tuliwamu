from django.db.models import Q
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import Case, CommunityReport, ChildRelationship
from .serializers import (
    CaseSerializer,
    CaseStatusSerializer,
    CommunityReportSerializer,
    CommunityReportReviewSerializer,
    ChildRelationshipSerializer,
    ChildRelationshipVerificationSerializer,
    GuardianCaseSummarySerializer,
    CaseAssignmentSerializer
)
from .permissions import (
    CasePermissions,
    CanUpdateCaseStatus,
    CommunityReportPermissions,
    CanReviewCommunityReport,
    ChildRelationshipPermissions,
    CanVerifyChildRelationship,
    CanViewGuardianCases
)
class CaseListCreateView(generics.ListCreateAPIView):
    serializer_class = CaseSerializer
    permission_classes = [IsAuthenticated, CasePermissions]

    def get_queryset(self):
        user = self.request.user

        if user.role == "ADMIN":
            queryset = Case.objects.all()
        else:
            queryset = Case.objects.filter(
                Q(created_by=user) | Q(assigned_officer=user)
            )

        search = self.request.query_params.get("search")
        status = self.request.query_params.get("status")
        category = self.request.query_params.get("case_category")
        district = self.request.query_params.get("district")

        if search:
            queryset = queryset.filter(
                Q(child_name__icontains=search)
                | Q(district__icontains=search)
                | Q(description__icontains=search)
            )

        if status:
            queryset = queryset.filter(status=status)

        if category:
            queryset = queryset.filter(case_category=category)

        if district:
            queryset = queryset.filter(district__icontains=district)

        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class CaseDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = CaseSerializer
    permission_classes = [IsAuthenticated, CasePermissions]

    def get_queryset(self):
        user = self.request.user

        if user.role == "ADMIN":
            return Case.objects.all()

        return Case.objects.filter(
            Q(created_by=user) | Q(assigned_officer=user)
        )


class CaseStatusUpdateView(generics.UpdateAPIView):
    serializer_class = CaseStatusSerializer
    permission_classes = [IsAuthenticated, CanUpdateCaseStatus]
    http_method_names = ["patch", "options"]

    def get_queryset(self):
        user = self.request.user

        if user.role == "ADMIN":
            return Case.objects.all()

        return Case.objects.filter(
            assigned_officer=user,
        )



class CaseAssignmentView(generics.UpdateAPIView):
    queryset = Case.objects.all()
    serializer_class = CaseAssignmentSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["patch", "options", "head"]

    def get_permissions(self):
        from rest_framework.permissions import BasePermission

        class IsAdminRole(BasePermission):
            def has_permission(self, request, view):
                return request.user.role == "ADMIN"

        return [IsAuthenticated(), IsAdminRole()]
class CommunityReportListCreateView(generics.ListCreateAPIView):
    serializer_class = CommunityReportSerializer
    permission_classes = [IsAuthenticated, CommunityReportPermissions]

    def get_queryset(self):
        user = self.request.user

        if user.role in ("ADMIN", "POLICE", "PSWO"):
            return CommunityReport.objects.all()

        return CommunityReport.objects.filter(reporter=user)

    def perform_create(self, serializer):
        serializer.save(reporter=self.request.user)


class CommunityReportDetailView(generics.RetrieveAPIView):
    serializer_class = CommunityReportSerializer
    permission_classes = [IsAuthenticated, CommunityReportPermissions]

    def get_queryset(self):
        user = self.request.user

        if user.role in ("ADMIN", "POLICE", "PSWO"):
            return CommunityReport.objects.all()

        return CommunityReport.objects.filter(reporter=user)


class CommunityReportReviewView(generics.UpdateAPIView):
    queryset = CommunityReport.objects.all()
    serializer_class = CommunityReportReviewSerializer
    permission_classes = [IsAuthenticated, CanReviewCommunityReport]
    http_method_names = ["patch", "options"]


class ChildRelationshipListCreateView(generics.ListCreateAPIView):
    serializer_class = ChildRelationshipSerializer
    permission_classes = [IsAuthenticated, ChildRelationshipPermissions]

    def get_queryset(self):
        user = self.request.user

        if user.role in ("ADMIN", "POLICE", "PSWO"):
            return ChildRelationship.objects.all()

        return ChildRelationship.objects.filter(user=user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ChildRelationshipVerificationView(generics.UpdateAPIView):
    queryset = ChildRelationship.objects.all()
    serializer_class = ChildRelationshipVerificationSerializer
    permission_classes = [IsAuthenticated, CanVerifyChildRelationship]
    http_method_names = ["patch", "options"]

    def perform_update(self, serializer):
        from django.utils import timezone

        serializer.save(
            verified_by=self.request.user,
            verified_at=timezone.now(),
        )


class GuardianCaseFollowUpView(generics.ListAPIView):
    serializer_class = GuardianCaseSummarySerializer
    permission_classes = [IsAuthenticated, CanViewGuardianCases]

    def get_queryset(self):
        return Case.objects.filter(
            child__relationships__user=self.request.user,
            child__relationships__verification_status="VERIFIED",
            child__relationships__access_granted=True,
        ).distinct()
