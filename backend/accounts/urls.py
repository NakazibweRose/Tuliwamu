from django.urls import path

from .views import (
    CommunityRegistrationView,
    StaffAccountCreationView,
    UserProfileView,
    StaffAccountListView,
    StaffAccountStatusView,
    StaffRoleUpdateView
)

urlpatterns = [
    path("register/", CommunityRegistrationView.as_view(), name="community-register"),
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