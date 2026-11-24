from django.contrib import admin
from .models import Referral, PublicReport, Station

@admin.register(Referral)
class ReferralAdmin(admin.ModelAdmin):
    list_display = (
        'case',
        'referring_institution',
        'receiving_institution',
        'status',
        'date_referred',
    )

    list_filter = ('status', 'referring_institution')
    search_fields = (
        'case__reference_number',
        'receiving_institution',
        'referring_institution',
    )


@admin.register(PublicReport)
class PublicReportAdmin(admin.ModelAdmin):
    list_display = (
        "reference_code",
        "category",
        "district",
        "channel",
        "status",
        "case",
        "created_at",
    )
    list_filter = ("category", "status", "channel", "district")
    search_fields = ("reference_code", "district", "contact_phone")
    readonly_fields = ("reference_code", "created_at")

@admin.register(Station)
class StationAdmin(admin.ModelAdmin):
    list_display = ("name", "phone_number", "is_active")
    list_filter = ("is_active",)
    search_fields = ("name", "phone_number")