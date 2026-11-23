
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Referral
from .serializers import ReferralSerializer


class ReferralListCreateView(generics.ListCreateAPIView):
    queryset = Referral.objects.all()
    serializer_class = ReferralSerializer
    permission_classes = [IsAuthenticated]


class ReferralDetailView(generics.RetrieveUpdateAPIView):
    queryset = Referral.objects.all()
    serializer_class = ReferralSerializer
    permission_classes = [IsAuthenticated]



