from django.urls import path

from .views import (
    StaffAccountCreationView,
    UserProfileView,
    StaffAccountListView,
    StaffAccountStatusView,
    StaffRoleUpdateView,
    InstitutionListCreateView,
)

urlpatterns = [
    path("institutions/", InstitutionListCreateView.as_view(), name="institution-list-create"),
    path("staff/", StaffAccountCreationView.as_view(), name="staff-account-create"),
    path("profile/", UserProfileView.as_view(), name="user-profile"),
    path("staff/list/", StaffAccountListView.as_view(), name="staff-account-list"),
    path("staff/<int:pk>/status/", StaffAccountStatusView.as_view(), name="staff-account-status"),
    path(
    "staff/<int:pk>/role/",
    StaffRoleUpdateView.as_view(),
    name="staff-role-update",
),
]