from django.urls import path
from .ussd import ussd_callback
from .views import (
    ReferralListCreateView,
    ReferralDetailView,
    ReferralFollowUpListCreateView,
    ReferralFollowUpDetailView,
    ReferralOfficerListView,
)

urlpatterns = [
    path('', ReferralListCreateView.as_view(), name='referral-list-create'),

    path(
        'follow-ups/',
        ReferralFollowUpListCreateView.as_view(),
        name='follow-up-list-create',
    ),

    path(
        'follow-ups/<int:pk>/',
        ReferralFollowUpDetailView.as_view(),
        name='follow-up-detail',
    ),

    path('<int:pk>/', ReferralDetailView.as_view(), name='referral-detail'),

    path('ussd/', ussd_callback, name='ussd-callback'),
    path('officers/', ReferralOfficerListView.as_view(), name='referral-officers'),
]