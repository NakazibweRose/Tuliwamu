
from django.urls import path
from .views import ReferralListCreateView, ReferralDetailView

urlpatterns = [
    path('', ReferralListCreateView.as_view(), name='referral-list-create'),
    path('<int:pk>/', ReferralDetailView.as_view(), name='referral-detail'),
]
