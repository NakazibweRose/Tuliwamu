from django.urls import path

from .public_views import (
    PublicReportConvertView,
    PublicReportDetailView,
    PublicReportListCreateView,
    PublicReportStatusView,
)

urlpatterns = [
    path("", PublicReportListCreateView.as_view(), name="public-report-list-create"),
    path("status/<str:reference_code>/", PublicReportStatusView.as_view(), name="public-report-status"),
    path("<int:pk>/", PublicReportDetailView.as_view(), name="public-report-detail"),
    path("<int:pk>/convert/", PublicReportConvertView.as_view(), name="public-report-convert"),
]
