from django.contrib import admin
from .models import Referral


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