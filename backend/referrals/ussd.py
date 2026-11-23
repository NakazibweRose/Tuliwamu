
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from .models import PublicReport, Station, Referral


def ussd_response(message, end=False):
    prefix = "END" if end else "CON"
    return HttpResponse(
        f"{prefix} {message}",
        content_type="text/plain",
    )


@csrf_exempt
@require_POST
def ussd_callback(request):
    text = request.POST.get("text", "").strip()
    phone_number = request.POST.get("phoneNumber", "").strip()
    parts = text.split("*") if text else []

    # Main menu: available to everyone
    if not parts:
        return ussd_response(
            "Welcome to Tuliwamu - Child Justice Link\n"
            "1. Report a concern\n"
            "2. Seek help\n"
            "3. Check report status\n"
            "4. Institution access"
        )

    # Seek help
    if parts[0] == "2":
        return ussd_response(
            "If a child is in immediate danger, contact the "
            "nearest police or child protection office. "
            "Tuliwamu is not an emergency service.",
            end=True,
        )

    # Public report submission
    if parts[0] == "1":
        if len(parts) == 1:
            return ussd_response(
                "Select concern category:\n"
                "1. Child protection\n"
                "2. Neglect\n"
                "3. Violence or abuse\n"
                "4. Other"
            )

        categories = {
            "1": PublicReport.Category.PROTECTION,
            "2": PublicReport.Category.NEGLECT,
            "3": PublicReport.Category.VIOLENCE,
            "4": PublicReport.Category.OTHER,
        }

        category = categories.get(parts[1])
        if not category:
            return ussd_response(
                "Invalid category. Please try again.",
                end=True,
            )

        if len(parts) == 2:
            return ussd_response("Enter the district:")

        district = parts[2].strip()
        if not district or len(district) > 100:
            return ussd_response(
                "Invalid district. Please start again.",
                end=True,
            )

        if len(parts) == 3:
            return ussd_response(
                "Briefly describe your concern. "
                "Do not include the child's full name."
            )

        description = parts[3].strip()
        if not description or len(description) > 1000:
            return ussd_response(
                "Invalid description. Please start again.",
                end=True,
            )

        if len(parts) == 4:
            return ussd_response(
                "Would you like to provide your phone number "
                "for follow-up?\n1. Yes\n2. No"
            )

        if parts[4] == "1":
            contact_phone = phone_number or None
        elif parts[4] == "2":
            contact_phone = None
        else:
            return ussd_response(
                "Invalid choice. Please start again.",
                end=True,
            )

        report = PublicReport.objects.create(
            category=category,
            district=district,
            description=description,
            contact_phone=contact_phone,
        )

        return ussd_response(
            "Your report has been received.\n"
            f"Reference: {report.reference_code}\n"
            "Keep this code to check your report status.",
            end=True,
        )

    # Public report status lookup
    if parts[0] == "3":
        if len(parts) == 1:
            return ussd_response(
                "Enter your report reference code:"
            )

        reference = parts[1].strip().upper()
        report = PublicReport.objects.filter(
            reference_code__iexact=reference
        ).first()

        if not report:
            return ussd_response(
                "Report not found. Check your reference code.",
                end=True,
            )

        return ussd_response(
            f"Report status: {report.get_status_display()}",
            end=True,
        )

    # Institution access: caller must match a registered station
    if parts[0] == "4":
        station = Station.objects.filter(
            phone_number=phone_number,
            is_active=True,
        ).first()

        if not station:
            return ussd_response(
                "This number is not registered for institution "
                "access. Public services remain available "
                "from the main menu.",
                end=True,
            )

        if len(parts) == 1:
            return ussd_response(
                f"Institution: {station.name}\n"
                "1. View referral inbox"
            )

        if parts[1] == "1":
            referrals = list(
                Referral.objects.filter(
                    receiving_institution__iexact=station.name
                ).order_by("-date_referred")[:5]
            )

            if not referrals:
                return ussd_response(
                    "No referrals are currently assigned "
                    "to your institution.",
                    end=True,
                )

            message = "Recent referrals:\n"
            for referral in referrals:
                message += (
                    f"Referral #{referral.id} - "
                    f"{referral.get_status_display()}\n"
                )

            return ussd_response(message.strip(), end=True)

        return ussd_response(
            "Invalid institution option.",
            end=True,
        )

    return ussd_response(
        "Invalid option. Please dial again.",
        end=True,
    )
