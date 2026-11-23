from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated,BasePermission
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import User
from .serializers import (
    CommunityRegistrationSerializer,
    CustomTokenObtainPairSerializer,
    StaffAccountCreationSerializer
)

class IsAdminUser(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == User.Role.ADMIN
        )

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class CommunityRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = CommunityRegistrationSerializer
    permission_classes = [AllowAny]


class StaffAccountCreationView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = StaffAccountCreationSerializer
    permission_classes = [IsAdminUser]
    
class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role,
        })