from rest_framework.permissions import SAFE_METHODS, BasePermission

INTAKE_ROLES = ("ADMIN", "POLICE", "PSWO")
CASE_READER_ROLES = ("ADMIN", "POLICE", "PSWO", "LEGAL_AID", "SERVICE_PROVIDER")


class CasePermissions(BasePermission):
    """
    Admins, Police and PSWOs can register cases.
    Case readers see only cases they are entitled to (see cases/access.py).
    Only admins can edit a case record directly.
    Oversight users have no access to individual cases.
    """

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        if request.method in SAFE_METHODS:
            return user.role in CASE_READER_ROLES

        if request.method == "POST":
            return user.role in INTAKE_ROLES

        return user.role == "ADMIN"


class CanUpdateCaseStatus(BasePermission):
    """Admins, or the Police Officer/PSWO assigned to the case."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in INTAKE_ROLES
        )

    def has_object_permission(self, request, view, obj):
        user = request.user

        if user.role == "ADMIN":
            return True

        return obj.assigned_officer_id == user.id


class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == "ADMIN"
        )
