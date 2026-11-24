"""Anonymous public reports (web) + officer triage.

The USSD channel lives in ussd.py. Both create PublicReport records.
"""

from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from audit.models import AuditLog, record
from cases.serializers import CaseSerializer

from .models import PublicReport
from .serializers import PublicReportSerializer, PublicReportSubmitSerializer

TRIAGE_ROLES = ("ADMIN", "POLICE", "PSWO")


class CanTriageReports(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in TRIAGE_ROLES
        )


class PublicReportListCreateView(generics.ListCreateAPIView):
    """POST: anyone may submit, no login (rate-limited).
    GET: triage inbox for Police, PSWOs and admins."""

    throttle_scope = "public_report"

    def get_permissions(self):
        if self.request.method == "POST":
            return [AllowAny()]
        return [IsAuthenticated(), CanTriageReports()]

    def get_throttles(self):
        if self.request.method == "POST":
            return [ScopedRateThrottle()]
        return []

    def get_serializer_class(self):
        if self.request.method == "POST":
            return PublicReportSubmitSerializer
        return PublicReportSerializer

    def get_queryset(self):
        queryset = PublicReport.objects.all()
        for param in ("status", "category", "channel"):
            value = self.request.query_params.get(param)
            if value:
                queryset = queryset.filter(**{param: value})
        district = self.request.query_params.get("district")
        if district:
            queryset = queryset.filter(district__icontains=district)
        return queryset

    def perform_create(self, serializer):
        contact = (serializer.validated_data.get("contact_phone") or "").strip() or None
        serializer.save(channel="WEB", contact_phone=contact)


class PublicReportStatusView(APIView):
    """Anyone with the reference code can see the status, and nothing else."""

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "public_report"

    def get(self, request, reference_code):
        report = get_object_or_404(PublicReport, reference_code__iexact=reference_code.strip())
        return Response(
            {
                "reference_code": report.reference_code,
                "status": report.status,
                "status_display": report.get_status_display(),
            }
        )


class PublicReportDetailView(generics.RetrieveUpdateAPIView):
    """Officers can view a report and mark it UNDER_REVIEW or CLOSED."""

    queryset = PublicReport.objects.all()
    serializer_class = PublicReportSerializer
    permission_classes = [IsAuthenticated, CanTriageReports]
    http_method_names = ["get", "patch", "options", "head"]

    def perform_update(self, serializer):
        old_status = serializer.instance.status
        report = serializer.save(reviewed_by=self.request.user)
        record(
            self.request.user,
            AuditLog.Action.STATUS_CHANGE,
            report,
            f"{old_status} -> {report.status}",
        )


class PublicReportConvertView(APIView):
    """Turn an anonymous report into a protected case.

    Body: case_category, incident_type, child_name, child_age,
    incident_date, and optional assigned_officer (defaults to the caller).
    District and description are copied from the report.
    """

    permission_classes = [IsAuthenticated, CanTriageReports]

    def post(self, request, pk):
        report = get_object_or_404(PublicReport, pk=pk)

        if report.case_id:
            return Response(
                {"detail": "This report is already linked to a case.", "case": report.case_id},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = {
            "case_category": request.data.get("case_category"),
            "incident_type": request.data.get("incident_type"),
            "child_name": request.data.get("child_name"),
            "child_age": request.data.get("child_age"),
            "incident_date": request.data.get("incident_date"),
            "district": report.district,
            "description": (
                f"[From public report {report.reference_code}] {report.description}"
            ),
        }

        assigned_officer = request.data.get("assigned_officer")
        if assigned_officer:
            data["assigned_officer"] = assigned_officer
        elif request.user.role in ("POLICE", "PSWO"):
            data["assigned_officer"] = request.user.id

        serializer = CaseSerializer(data=data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            case = serializer.save(created_by=request.user)
            report.case = case
            report.status = PublicReport.ReportStatus.REFERRED
            report.reviewed_by = request.user
            report.save(update_fields=["case", "status", "reviewed_by", "updated_at"])

        record(request.user, AuditLog.Action.CONVERT, report, f"case #{case.pk}")
        record(request.user, AuditLog.Action.CREATE, case, f"from public report #{report.pk}")

        return Response(
            {
                "report": PublicReportSerializer(report).data,
                "case": CaseSerializer(case, context={"request": request}).data,
            },
            status=status.HTTP_201_CREATED,
        )
