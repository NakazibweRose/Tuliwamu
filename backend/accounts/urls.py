from django.urls import path

from .views import (
    CommunityRegistrationView,
    StaffAccountCreationView,
    UserProfileView,
)

urlpatterns = [
    path("register/", CommunityRegistrationView.as_view(), name="community-register"),
    path("staff/", StaffAccountCreationView.as_view(), name="staff-account-create"),
    path("profile/", UserProfileView.as_view(), name="user-profile"),
]