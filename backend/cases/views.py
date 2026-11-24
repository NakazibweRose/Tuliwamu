from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated

from audit.models import AuditLog, record
from audit.serializers import AuditLogSerializer

from .access import can_view_access_log, can_view_identity, visible_cases
from .models import Case
from .permissions import CanUpdateCaseStatus, CasePermissions, IsAdminRole
from .serializers import (
    CaseAssignmentSerializer,
    CaseSerializer,
    CaseStatusSerializer,
)


class CaseListCreateView(generics.ListCreateAPIView):
    serializer_class = CaseSerializer
    permission_classes = [IsAuthenticated, CasePermissions]

    def get_queryset(self):
        user = self.request.user
        queryset = visible_cases(user).order_by("-created_at")

        search = self.request.query_params.get("search")
        status = self.request.query_params.get("status")
        category = self.request.query_params.get("case_category")
        district = self.request.query_params.get("district")

        if search:
            search_filter = Q(district__icontains=search)
            # Only users who may see identities can search by name or
            # description; otherwise search would leak hidden details.
            if user.role in ("ADMIN", "POLICE", "PSWO"):
                search_filter |= Q(child_name__icontains=search) | Q(
                    description__icontains=search
                )
            queryset = queryset.filter(search_filter)

        if status:
            queryset = queryset.filter(status=status)

        if category:
            queryset = queryset.filter(case_category=category)

        if district:
            queryset = queryset.filter(district__icontains=district)

        return queryset

    def perform_create(self, serializer):
        case = serializer.save(created_by=self.request.user)
        record(self.request.user, AuditLog.Action.CREATE, case)


class CaseDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = CaseSerializer
    permission_classes = [IsAuthenticated, CasePermissions]

    def get_queryset(self):
        return visible_cases(self.request.user)

    def retrieve(self, request, *args, **kwargs):
        case = self.get_object()
        detail = "full record" if can_view_identity(request.user, case) else "minimised record"
        record(request.user, AuditLog.Action.VIEW, case, detail)
        return super().retrieve(request, *args, **kwargs)

    def perform_update(self, serializer):
        case = serializer.save()
        record(
            self.request.user,
            AuditLog.Action.UPDATE,
            case,
            "fields: " + ", ".join(sorted(serializer.validated_data)),
        )


class CaseStatusUpdateView(generics.UpdateAPIView):
    serializer_class = CaseStatusSerializer
    permission_classes = [IsAuthenticated, CanUpdateCaseStatus]
    http_method_names = ["patch", "options"]

    def get_queryset(self):
        user = self.request.user

        if user.role == "ADMIN":
            return Case.objects.all()

        return Case.objects.filter(assigned_officer=user)

    def perform_update(self, serializer):
        old_status = serializer.instance.status
        case = serializer.save()
        record(
            self.request.user,
            AuditLog.Action.STATUS_CHANGE,
            case,
            f"{old_status} -> {case.status}",
        )


class CaseAssignmentView(generics.UpdateAPIView):
    queryset = Case.objects.all()
    serializer_class = CaseAssignmentSerializer
    permission_classes = [IsAuthenticated, IsAdminRole]
    http_method_names = ["patch", "options", "head"]

    def perform_update(self, serializer):
        case = serializer.save()
        record(
            self.request.user,
            AuditLog.Action.ASSIGN,
            case,
            f"assigned to user #{case.assigned_officer_id}",
        )


class CaseAccessLogView(generics.ListAPIView):
    """Who has viewed or changed this case. Visible to admins, the
    registering officer and the assigned officer."""

    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        case = get_object_or_404(visible_cases(self.request.user), pk=self.kwargs["pk"])

        if not can_view_access_log(self.request.user, case):
            raise PermissionDenied("You cannot view this case's access history.")

        return AuditLog.objects.filter(
            object_type=case._meta.label,
            object_id=case.pk,
        ).select_related("user")
