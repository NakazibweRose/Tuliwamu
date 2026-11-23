from django.urls import path

from .views import (
    CaseListCreateView,
    CaseDetailView,
    CaseStatusUpdateView,
)


urlpatterns = [
    path("cases/", CaseListCreateView.as_view(), name="case-list-create"),
    path("cases/<int:pk>/", CaseDetailView.as_view(), name="case-detail"),
    path(
        "cases/<int:pk>/status/",
        CaseStatusUpdateView.as_view(),
        name="case-status-update",
    ),
]