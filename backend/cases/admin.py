from django.contrib import admin

from .models import Case


@admin.register(Case)
class CaseAdmin(admin.ModelAdmin):
    list_display = (
        "reference_number",
        "child_name",
        "case_category",
        "incident_type",
        "district",
        "status",
        "assigned_officer",
        "created_at",
    )

    list_filter = (
        "case_category",
        "status",
        "incident_type",
        "district",
    )

    search_fields = (
        "reference_number",
        "child_name",
        "district",
    )

    readonly_fields = (
        "reference_number",
        "created_at",
        "updated_at",
    )

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user

        super().save_model(request, obj, form, change)