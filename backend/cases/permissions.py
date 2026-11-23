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


class CommunityReportPermissions(BasePermission):
    """
    Community members can submit reports.
    Police, PSWOs and administrators can review reports.
    """

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        if request.method in ("GET", "HEAD", "OPTIONS"):
            return user.role in (
                "ADMIN",
                "POLICE",
                "PSWO",
                "COMMUNITY",
            )

        if request.method == "POST":
            return user.role in (
                "ADMIN",
                "POLICE",
                "PSWO",
                "COMMUNITY",
            )

        return user.role == "ADMIN"

    def has_object_permission(self, request, view, obj):
        user = request.user

        if user.role in ("ADMIN", "POLICE", "PSWO"):
            return True

        return obj.reporter_id == user.id

class CanReviewCommunityReport(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in ("ADMIN", "POLICE", "PSWO")
        )

class ChildRelationshipPermissions(BasePermission):
    """
    Community members can request access.
    Officers can review relationship requests.
    """

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        if request.method in ("GET", "HEAD", "OPTIONS"):
            return user.role in (
                "ADMIN",
                "POLICE",
                "PSWO",
                "COMMUNITY",
            )

        if request.method == "POST":
            return user.role == "COMMUNITY"

        return False

    def has_object_permission(self, request, view, obj):
        user = request.user

        if user.role in ("ADMIN", "POLICE", "PSWO"):
            return True

        return obj.user_id == user.id


class CanVerifyChildRelationship(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in ("ADMIN", "POLICE", "PSWO")
        )


class CanViewGuardianCases(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == "COMMUNITY"
        )