from django.db.models import Q
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import Case

from .serializers import CaseSerializer, CaseStatusSerializer
from .permissions import CasePermissions, CanUpdateCaseStatus

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