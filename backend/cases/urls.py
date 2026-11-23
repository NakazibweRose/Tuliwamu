from django.urls import path

from .views import (
    CaseListCreateView,
    CaseDetailView,
    CaseStatusUpdateView,
    CommunityReportListCreateView,
CommunityReportDetailView,
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
]