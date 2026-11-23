from django.db.models import Q
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import Case, CommunityReport

from .serializers import (
    CaseSerializer,
    CaseStatusSerializer,
    CommunityReportSerializer,
    CommunityReportReviewSerializer
)
from .permissions import (
    CasePermissions,
    CanUpdateCaseStatus,
    CommunityReportPermissions,
    CanReviewCommunityReport
)

class CaseListCreateView(generics.ListCreateAPIView):
    serializer_class = CaseSerializer
    permission_classes = [IsAuthenticated, CasePermissions]

    def get_queryset(self):
        user = self.request.user

        if user.role == "ADMIN":
            return Case.objects.all()

        return Case.objects.filter(
            Q(created_by=user) | Q(assigned_officer=user)
        )

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
