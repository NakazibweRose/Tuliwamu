"""The journey of a child in conflict with the law, from arrest to outcome.

    Arrest -> Police investigation -> File at ODPP -> Sanctioned (charge
    approved) -> In court (plea, hearings) -> Closed
                      \\-> Diverted (out of the formal system, with a PSWO)

One Journey hangs off one Case (category CHILD_IN_CONFLICT_WITH_LAW).
The family follows it with a tracking code + PIN and only ever sees the
plain-language messages in PUBLIC_MESSAGES, never evidence or notes.
"""

import secrets

from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.db import models
from django.utils import timezone

from . import rules


def generate_tracking_code():
    # No 0/O/1/I so it is easy to read out over the phone.
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    return "TJ-" + "".join(secrets.choice(alphabet) for _ in range(6))


class Journey(models.Model):
    class Stage(models.TextChoices):
        ARRESTED = "ARRESTED", "Arrested / reported to police"
        INVESTIGATION = "INVESTIGATION", "Police investigation"
        AT_DPP = "AT_DPP", "File with the ODPP"
        SANCTIONED = "SANCTIONED", "Charge approved by ODPP"
        IN_COURT = "IN_COURT", "In court"
        DIVERTED = "DIVERTED", "Diverted from court"
        CLOSED = "CLOSED", "Closed"

    # Order used for the progress bar. DIVERTED is a side exit.
    MAIN_PATH = ["ARRESTED", "INVESTIGATION", "AT_DPP", "SANCTIONED", "IN_COURT", "CLOSED"]

    class Custody(models.TextChoices):
        POLICE_CUSTODY = "POLICE_CUSTODY", "In police custody"
        WITH_GUARDIAN = "WITH_GUARDIAN", "Released to parent/guardian (police bond)"
        REMAND_HOME = "REMAND_HOME", "On remand (remand home)"
        BAIL = "BAIL", "On bail"
        FREE = "FREE", "Not in custody (case closed or diverted)"

    case = models.OneToOneField(
        "cases.Case", on_delete=models.PROTECT, related_name="journey"
    )
    stage = models.CharField(max_length=20, choices=Stage.choices, default=Stage.ARRESTED)
    custody_status = models.CharField(
        max_length=20, choices=Custody.choices, default=Custody.POLICE_CUSTODY
    )
    is_capital_offence = models.BooleanField(
        default=False, help_text="Punishable by death: remand limit is 3 months, not 45 days."
    )

    arrested_at = models.DateTimeField(default=timezone.now)
    custody_started_at = models.DateTimeField(null=True, blank=True)
    remand_started_at = models.DateTimeField(null=True, blank=True)
    guardian_notified_at = models.DateTimeField(null=True, blank=True)
    pswo_notified_at = models.DateTimeField(null=True, blank=True)

    pswo = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="pswo_journeys",
    )
    prosecutor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="prosecutor_journeys",
    )
    court = models.ForeignKey(
        "accounts.Institution", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="court_journeys",
    )
    sent_to_dpp_at = models.DateTimeField(null=True, blank=True)
    sanctioned_at = models.DateTimeField(null=True, blank=True)
    next_court_date = models.DateTimeField(null=True, blank=True)
    next_court_purpose = models.CharField(max_length=100, blank=True)
    outcome = models.CharField(max_length=255, blank=True)

    # Only for SMS reminders. Never returned by the public tracker.
    guardian_phone = models.CharField(max_length=20, blank=True)
    tracking_code = models.CharField(
        max_length=12, unique=True, default=generate_tracking_code, editable=False
    )
    tracking_pin_hash = models.CharField(max_length=128, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-arrested_at"]

    def __str__(self):
        return self.tracking_code

    # --- family tracker PIN -------------------------------------------
    def issue_pin(self):
        """Create a new 6-digit PIN, store only its hash, return it once."""
        pin = f"{secrets.randbelow(10**6):06d}"
        self.tracking_pin_hash = make_password(pin)
        self.save(update_fields=["tracking_pin_hash", "updated_at"])
        return pin

    def check_pin(self, pin):
        return bool(self.tracking_pin_hash) and check_password(str(pin), self.tracking_pin_hash)

    # --- legal checks --------------------------------------------------
    @property
    def below_criminal_responsibility(self):
        age = self.case.child_age
        return age is not None and age < rules.AGE_OF_CRIMINAL_RESPONSIBILITY

    def custody_deadline(self):
        if self.custody_status == self.Custody.POLICE_CUSTODY and self.custody_started_at:
            return self.custody_started_at + rules.POLICE_CUSTODY_LIMIT
        return None

    def remand_deadline(self):
        if self.custody_status == self.Custody.REMAND_HOME and self.remand_started_at:
            return self.remand_started_at + rules.remand_limit(self.is_capital_offence)
        return None

    def alerts(self, now=None):
        """Legal deadlines and safeguards that need action, most urgent first."""
        now = now or timezone.now()
        alerts = []
        open_case = self.stage not in (self.Stage.CLOSED, self.Stage.DIVERTED)

        if self.below_criminal_responsibility and open_case:
            alerts.append(("danger", "Child is under 12: cannot be charged. Release to guardian and refer to PSWO (s.133)."))

        deadline = self.custody_deadline()
        if deadline:
            if now > deadline:
                hours = int((now - deadline).total_seconds() // 3600)
                alerts.append(("danger", f"Held {hours}h beyond the 24-hour police custody limit: take to court or release (s.134(7))."))
            else:
                left = deadline - now
                alerts.append(("warning", f"Police custody: {int(left.total_seconds() // 3600)}h {int(left.total_seconds() % 3600 // 60)}m left of 24h (s.134(7))."))

        if open_case and not self.guardian_notified_at:
            alerts.append(("danger", "Parent/guardian not yet informed of the arrest (s.134)."))
        if open_case and not self.pswo_notified_at:
            alerts.append(("warning", "No Probation & Social Welfare Officer notified yet (s.134(5))."))

        deadline = self.remand_deadline()
        if deadline:
            limit = "3 months" if self.is_capital_offence else "45 days"
            if now > deadline:
                alerts.append(("danger", f"Remand limit of {limit} passed: child must be released on bail (s.136(5))."))
            elif deadline - now <= rules.REMAND_WARNING:
                alerts.append(("warning", f"Remand limit of {limit} ends in {(deadline - now).days} day(s) (s.136(5))."))

        if self.next_court_date and now <= self.next_court_date <= now + rules.COURT_REMINDER_WINDOW:
            alerts.append(("info", "Court date within 3 days: guardian reminded by SMS."))

        return [{"level": level, "message": message} for level, message in alerts]


class IngredientCheck(models.Model):
    """A State Attorney's finding on one ingredient of the offence."""

    journey = models.ForeignKey(Journey, on_delete=models.CASCADE, related_name="ingredients")
    key = models.CharField(max_length=50)
    satisfied = models.BooleanField(default=False)
    evidence = models.CharField(
        max_length=200, blank=True,
        help_text="Which document proves it, e.g. 'PF3 medical report'. No names.",
    )
    checked_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    checked_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("journey", "key")


# What the family sees for each event. Fixed text, so no officer can
# accidentally publish evidence, names or notes to the public tracker.
PUBLIC_MESSAGES = {
    "ARRESTED": "The child was received by the Police Child & Family Protection Unit.",
    "GUARDIAN_NOTIFIED": "A parent/guardian was informed.",
    "PSWO_NOTIFIED": "A Probation & Social Welfare Officer was assigned to support the child.",
    "RELEASED_TO_GUARDIAN": "The child was released to a parent/guardian while the case continues.",
    "INVESTIGATION": "The police are investigating. Details of the investigation are not shared.",
    "DIVERTED": "The case was diverted away from court. The probation officer will guide the next steps.",
    "SENT_TO_DPP": "The police file was sent to the Office of the DPP to decide whether to charge.",
    "RETURNED_TO_POLICE": "The DPP asked the police for more investigation.",
    "SANCTIONED": "The DPP approved a charge. The case will go to court.",
    "NO_CHARGE": "The DPP decided not to charge. The case is closed.",
    "COURT_DATE": "A court date was set.",
    "PLEA": "The child appeared in court to take a plea.",
    "REMANDED": "The court remanded the child to a remand home.",
    "BAIL": "The child was released on bail.",
    "CLOSED": "The case was concluded.",
}


class JourneyEvent(models.Model):
    journey = models.ForeignKey(Journey, on_delete=models.CASCADE, related_name="events")
    kind = models.CharField(max_length=30)
    # Internal note for officers only. Never shown to the family.
    note = models.CharField(max_length=255, blank=True)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["created_at", "id"]

    @property
    def public_message(self):
        return PUBLIC_MESSAGES.get(self.kind, "")
