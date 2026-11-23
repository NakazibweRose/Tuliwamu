from django.urls import path

from .views import (
    CaseListCreateView,
    CaseDetailView,
    CaseStatusUpdateView,
    CommunityReportListCreateView,
CommunityReportDetailView,
CommunityReportReviewView,
ChildRelationshipListCreateView,
ChildRelationshipVerificationView,
GuardianCaseFollowUpView,
CaseAssignmentView
)


urlpatterns = [
    path("cases/", CaseListCreateView.as_view(), name="case-list-create"),
    path("cases/<int:pk>/", CaseDetailView.as_view(), name="case-detail"),
    path(
        "cases/<int:pk>/status/",
        CaseStatusUpdateView.as_view(),
        name="case-status-update",
    ),
    path("reports/", CommunityReportListCreateView.as_view(), name="report-list-create"),
path("reports/<int:pk>/", CommunityReportDetailView.as_view(), name="report-detail"),
path(
    "reports/<int:pk>/review/",
    CommunityReportReviewView.as_view(),
    name="report-review",
),
path(
    "child-relationships/",
    ChildRelationshipListCreateView.as_view(),
    name="child-relationship-list-create",
),
path(
    "child-relationships/<int:pk>/verify/",
    ChildRelationshipVerificationView.as_view(),
    name="child-relationship-verify",
),
path(
    "guardian/cases/",
    GuardianCaseFollowUpView.as_view(),
    name="guardian-case-follow-up",
),
path(
    "cases/<int:pk>/assign/",
    CaseAssignmentView.as_view(),
    name="case-assignment",
),
]