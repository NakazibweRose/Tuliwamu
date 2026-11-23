from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated,BasePermission
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import User
from .serializers import (
    CommunityRegistrationSerializer,
    CustomTokenObtainPairSerializer,
    StaffAccountCreationSerializer,
    StaffAccountListSerializer,
    StaffAccountStatusSerializer,
    StaffRoleUpdateSerializer
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

class StaffAccountListView(generics.ListAPIView):
    serializer_class = StaffAccountListSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        return User.objects.exclude(
            role__in=[User.Role.ADMIN, User.Role.COMMUNITY]
        ).order_by("role", "username")

class StaffAccountStatusView(generics.UpdateAPIView):
    serializer_class = StaffAccountStatusSerializer
    permission_classes = [IsAdminUser]
    http_method_names = ["patch", "options", "head"]

    def get_queryset(self):
        return User.objects.exclude(
            role__in=[User.Role.ADMIN, User.Role.COMMUNITY]
        )

class StaffRoleUpdateView(generics.UpdateAPIView):
    serializer_class = StaffRoleUpdateSerializer
    permission_classes = [IsAdminUser]
    http_method_names = ["patch", "options", "head"]

    def get_queryset(self):
        return User.objects.exclude(
            role__in=[User.Role.ADMIN, User.Role.COMMUNITY]
        )
              
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