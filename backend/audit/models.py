from django.conf import settings
from django.db import models


class AuditLog(models.Model):
    """Who accessed or changed a child-sensitive record, and when.

    `detail` must never contain a child's name or case description.
    """

    class Action(models.TextChoices):
        VIEW = "VIEW", "Viewed"
        CREATE = "CREATE", "Created"
        UPDATE = "UPDATE", "Updated"
        STATUS_CHANGE = "STATUS_CHANGE", "Status changed"
        ASSIGN = "ASSIGN", "Assigned"
        REFER = "REFER", "Referred"
        CONVERT = "CONVERT", "Converted public report to case"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="audit_entries",
    )
    action = models.CharField(max_length=20, choices=Action.choices)
    object_type = models.CharField(max_length=50)
    object_id = models.PositiveIntegerField()
    detail = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["object_type", "object_id"])]

    def __str__(self):
        return f"{self.user} {self.action} {self.object_type}#{self.object_id}"


def record(user, action, obj, detail=""):
    """Write an audit entry for `obj` (any model instance)."""
    return AuditLog.objects.create(
        user=user if getattr(user, "is_authenticated", False) else None,
        action=action,
        object_type=obj._meta.label,
        object_id=obj.pk,
        detail=detail[:255],
    )
