"""Load FICTIONAL demo data. Never put real children's or reporters' details here.

    python manage.py seed_demo           # add demo data
    python manage.py seed_demo --reset   # wipe cases/referrals/reports/demo users first
"""

import random
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from accounts.models import Institution, User
from audit.models import AuditLog
from cases.models import Case
from referrals.models import (
    PublicReport,
    Referral,
    ReferralFollowUp,
    ReferralStatusHistory,
    Station,
)

DEMO_PASSWORD = "Tuliwamu2026!"

INSTITUTIONS = [
    ("Demo CFPU Wakiso", "POLICE_CFPU", "Wakiso", "+256700000101"),
    ("Demo CFPU Gulu", "POLICE_CFPU", "Gulu", "+256700000102"),
    ("Demo Probation Office Wakiso", "PROBATION_OFFICE", "Wakiso", "+256700000103"),
    ("Demo Legal Aid Clinic", "LEGAL_AID", "Kampala", "+256700000104"),
    ("Demo Child Support Centre", "SERVICE_PROVIDER", "Wakiso", "+256700000105"),
    ("Demo M&E Unit", "OVERSIGHT", "Kampala", "+256700000106"),
]

# username, role, institution, first name, last name, phone
USERS = [
    ("admin", "ADMIN", None, "System", "Admin", ""),
    ("police.wakiso", "POLICE", "Demo CFPU Wakiso", "Officer", "Amani", "+256700000201"),
    ("police.gulu", "POLICE", "Demo CFPU Gulu", "Officer", "Okello", "+256700000202"),
    ("pswo.wakiso", "PSWO", "Demo Probation Office Wakiso", "Probation Officer", "Nansubuga", "+256700000203"),
    ("legalaid", "LEGAL_AID", "Demo Legal Aid Clinic", "Advocate", "Kato", "+256700000204"),
    ("support", "SERVICE_PROVIDER", "Demo Child Support Centre", "Counsellor", "Apio", "+256700000205"),
    ("oversight", "OVERSIGHT", "Demo M&E Unit", "M&E", "Analyst", "+256700000206"),
]

DISTRICTS = ["Wakiso", "Kampala", "Gulu", "Mbarara", "Mukono", "Lira"]

REPORT_TEXTS = [
    "Child seen working at a quarry during school hours.",
    "Neighbour reports a young child left alone for several days.",
    "Concern about a child with injuries who is afraid to go home.",
    "Child not attending school and appears hungry.",
    "Teenager reportedly held at a trading centre after an alleged theft.",
]

# category, incident type, name, age, district, case status
CASES = [
    ("CHILD_PROTECTION", "NEGLECT", "Child A", 7, "Wakiso", "ACTIVE"),
    ("CHILD_PROTECTION", "ABUSE", "Child B", 13, "Wakiso", "ACTIVE"),
    ("CHILD_PROTECTION", "EXPLOITATION", "Child C", 15, "Kampala", "UNDER_REVIEW"),
    ("CHILD_IN_CONFLICT_WITH_LAW", "THEFT", "Child D", 14, "Wakiso", "ACTIVE"),
    ("CHILD_IN_CONFLICT_WITH_LAW", "ASSAULT", "Child E", 16, "Gulu", "ACTIVE"),
    ("CHILD_PROTECTION", "VIOLENCE", "Child F", 11, "Gulu", "NEW"),
    ("CHILD_PROTECTION", "NEGLECT", "Child G", 4, "Mukono", "CLOSED"),
    ("CHILD_IN_CONFLICT_WITH_LAW", "DRUG_RELATED", "Child H", 17, "Kampala", "UNDER_REVIEW"),
]


class Command(BaseCommand):
    help = "Load fictional demo data for Tuliwamu."

    def add_arguments(self, parser):
        parser.add_argument("--reset", action="store_true", help="Delete existing case data first.")

    @transaction.atomic
    def handle(self, *args, **options):
        random.seed(2026)
        now = timezone.now()

        if options["reset"]:
            for model in (ReferralFollowUp, ReferralStatusHistory, Referral, PublicReport, Case, AuditLog, Station):
                model.objects.all().delete()
            User.objects.filter(username__in=[u[0] for u in USERS]).delete()
            self.stdout.write("Existing demo data removed.")

        institutions = {}
        for name, kind, district, phone in INSTITUTIONS:
            institutions[name], _ = Institution.objects.update_or_create(
                name=name,
                defaults={"institution_type": kind, "district": district, "phone_number": phone},
            )

        users = {}
        for username, role, institution, first, last, phone in USERS:
            user, created = User.objects.get_or_create(username=username)
            user.role = role
            user.institution = institutions.get(institution)
            user.first_name, user.last_name, user.phone_number = first, last, phone
            user.is_staff = user.is_superuser = role == "ADMIN"
            if created:
                user.set_password(DEMO_PASSWORD)
            user.save()
            users[username] = user

        # USSD institution access for the legal aid clinic (Rose's flow).
        Station.objects.update_or_create(
            phone_number="+256700000104",
            defaults={"name": "Demo Legal Aid Clinic", "is_active": True},
        )

        intake = {"Wakiso": users["police.wakiso"], "Gulu": users["police.gulu"]}
        cases = []
        for index, (category, incident, name, age, district, case_status) in enumerate(CASES):
            officer = users["pswo.wakiso"] if category == "CHILD_IN_CONFLICT_WITH_LAW" and district == "Wakiso" else intake.get(district, users["police.wakiso"])
            case = Case.objects.create(
                case_category=category,
                incident_type=incident,
                child_name=name,
                child_age=age,
                description=f"Fictional demo case for {name}. No real person.",
                incident_date=(now - timedelta(days=20 - index)).date(),
                district=district,
                status=case_status,
                created_by=officer,
                assigned_officer=officer,
            )
            Case.objects.filter(pk=case.pk).update(created_at=now - timedelta(days=18 - index))
            cases.append(case)

        # (case index, receiver, final status, hours after referral for each step, days ago)
        referral_plan = [
            (0, "support", ["ACCEPTED", "IN_PROGRESS", "COMPLETED"], [5, 30, 200], 16),
            (1, "legalaid", ["ACCEPTED", "IN_PROGRESS"], [8, 26], 12),
            (1, "support", ["ACCEPTED"], [3], 11),
            (2, "legalaid", ["REJECTED"], [50], 10),
            (3, "legalaid", ["ACCEPTED", "IN_PROGRESS", "COMPLETED"], [12, 40, 150], 9),
            (4, "pswo.wakiso", ["ACCEPTED"], [20], 6),
            (5, "support", [], [], 3),          # pending, older than 48h
            (7, "legalaid", [], [], 0),         # pending, just referred: demo target
        ]
        reasons = {
            "legalaid": "Child needs legal representation and advice on the process.",
            "support": "Child needs psychosocial support and a safe place to stay.",
            "pswo.wakiso": "Assess for diversion and family support.",
        }
        for case_index, receiver_name, steps, hours, days_ago in referral_plan:
            case = cases[case_index]
            receiver = users[receiver_name]
            referred_at = now - timedelta(days=days_ago, hours=2)
            referral = Referral.objects.create(
                case=case,
                referred_by=case.created_by,
                receiving_officer=receiver,
                referring_institution=case.created_by.institution.name,
                receiving_institution=receiver.institution.name,
                reason=reasons[receiver_name],
            )
            old = "PENDING"
            for new, after in zip(steps, hours):
                entry = ReferralStatusHistory.objects.create(
                    referral=referral,
                    old_status=old,
                    new_status=new,
                    changed_by=receiver,
                    notes="Declined: outside our district." if new == "REJECTED" else "",
                )
                ReferralStatusHistory.objects.filter(pk=entry.pk).update(
                    date_changed=referred_at + timedelta(hours=after)
                )
                old = new
            Referral.objects.filter(pk=referral.pk).update(
                date_referred=referred_at,
                status=old,
                response_notes="Declined: outside our district." if old == "REJECTED" else "",
            )
            if old in ("ACCEPTED", "IN_PROGRESS"):
                ReferralFollowUp.objects.create(
                    referral=referral,
                    assigned_to=receiver,
                    due_date=(now + timedelta(days=random.choice([-3, -1, 2, 5]))).date(),
                    notes="Check on the child's wellbeing and update the referral.",
                )

        # Anonymous public reports from USSD and the web.
        categories = [c[0] for c in PublicReport.Category.choices]
        for index in range(40):
            district = DISTRICTS[index % len(DISTRICTS)] if index % 3 else "Wakiso"
            report = PublicReport.objects.create(
                category=random.choice(categories),
                district=district,
                description=random.choice(REPORT_TEXTS),
                channel="USSD" if index % 4 else "WEB",
                contact_phone=None if index % 3 else f"+2567000003{index:02d}",
                status=random.choice(["RECEIVED", "RECEIVED", "UNDER_REVIEW", "CLOSED"]),
            )
            PublicReport.objects.filter(pk=report.pk).update(created_at=now - timedelta(days=index % 14, hours=index))

        # Link a few reports to the cases they became.
        for report, case in zip(PublicReport.objects.filter(district="Wakiso")[:3], cases[:3]):
            report.case = case
            report.status = "REFERRED"
            report.save(update_fields=["case", "status"])

        self.stdout.write(self.style.SUCCESS("Fictional demo data loaded."))
        self.stdout.write(f"All demo users have the password: {DEMO_PASSWORD}")
        for username, role, institution, *_ in USERS:
            self.stdout.write(f"  {username:<15} {role:<17} {institution or ''}")
