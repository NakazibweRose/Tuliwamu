from django.urls import path

from .views import (
    CaseAccessLogView,
    CaseAssignmentView,
    CaseDetailView,
    CaseListCreateView,
    CaseStatusUpdateView,
)

urlpatterns = [
    path("cases/", CaseListCreateView.as_view(), name="case-list-create"),
    path("cases/<int:pk>/", CaseDetailView.as_view(), name="case-detail"),
    path("cases/<int:pk>/status/", CaseStatusUpdateView.as_view(), name="case-status-update"),
    path("cases/<int:pk>/assign/", CaseAssignmentView.as_view(), name="case-assignment"),
    path("cases/<int:pk>/access-log/", CaseAccessLogView.as_view(), name="case-access-log"),
]
