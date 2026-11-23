from rest_framework.permissions import BasePermission


class CasePermissions(BasePermission):
    """
    Administrators can perform all actions.
    Police and PSWOs can view and register cases.
    Legal Aid Providers can only view authorized cases.
    """

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        if request.method in ("GET", "HEAD", "OPTIONS"):
            return True

        if request.method == "POST":
            return user.role in (
                "ADMIN",
                "POLICE",
                "PSWO",
            )

        return user.role == "ADMIN"


class CanUpdateCaseStatus(BasePermission):
    """
    Administrators can update any case status.
    Assigned Police Officers and PSWOs can update their cases.
    Legal Aid Providers cannot update case status.
    """

    def has_object_permission(self, request, view, obj):
        user = request.user

        if user.role == "ADMIN":
            return True

        return (
            user.role in ("POLICE", "PSWO")
            and obj.assigned_officer_id == user.id
        )