from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Institution, User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ("Role Information", {"fields": ("role", "institution", "phone_number")}),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        ("Role Information", {"fields": ("role", "institution", "phone_number")}),
    )

    list_display = (
        "username",
        "first_name",
        "last_name",
        "role",
        "institution",
        "is_active",
    )

    list_filter = ("role", "institution", "is_active")


@admin.register(Institution)
class InstitutionAdmin(admin.ModelAdmin):
    list_display = ("name", "institution_type", "district", "is_active")
    list_filter = ("institution_type", "district", "is_active")
    search_fields = ("name", "district")
