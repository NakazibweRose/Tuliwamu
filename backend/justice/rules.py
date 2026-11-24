"""The law Tuliwamu encodes for a child in conflict with the law.

Every rule here cites its source so judges and officers can check it.
Children Act Cap 62 (Revised Edition 2023):
  s.133     age of criminal responsibility is 12
  s.134     parent/guardian (and a PSWO) informed after arrest;
            max 24 hours in police custody; never held with adults
  s.136(5)  remand max 3 months (offence punishable by death)
            or 45 days (any other offence), then release on bail
  s.148     the child's identity must never be published
"""

from datetime import timedelta

AGE_OF_CRIMINAL_RESPONSIBILITY = 12
POLICE_CUSTODY_LIMIT = timedelta(hours=24)
REMAND_LIMIT_CAPITAL = timedelta(days=90)
REMAND_LIMIT_OTHER = timedelta(days=45)
REMAND_WARNING = timedelta(days=7)
COURT_REMINDER_WINDOW = timedelta(days=3)

# The "ingredients" a State Attorney must find evidence for before
# sanctioning a charge. Keys are stable; labels are what officers see.
# Every offence also needs the child to be 12+ (checked automatically).
INGREDIENTS = {
    "THEFT": [
        ("property_of_another", "Property capable of being stolen belonged to another person"),
        ("taken_without_consent", "It was taken without the owner's consent"),
        ("intent_to_deprive", "Taken fraudulently, with intent to permanently deprive the owner"),
        ("participation", "Evidence identifies the child as the person who took it"),
    ],
    "ASSAULT": [
        ("unlawful_assault", "There was an unlawful assault"),
        ("bodily_harm", "Actual bodily harm resulted (medical evidence, e.g. Police Form 3)"),
        ("participation", "Evidence identifies the child as the person who did it"),
    ],
    "DEFILEMENT": [
        ("victim_under_18", "The victim was below 18 years (birth record, medical age assessment)"),
        ("sexual_act", "A sexual act took place (medical evidence, e.g. Police Form 3A)"),
        ("participation", "Evidence identifies the child as the person who did it (forensics, witnesses)"),
    ],
    "DRUG_RELATED": [
        ("prohibited_substance", "The substance is a prohibited narcotic (Government Analyst report)"),
        ("possession", "It was in the child's possession or control"),
        ("knowledge", "The child knew what the substance was"),
    ],
    "PROPERTY_DAMAGE": [
        ("property_of_another", "The property belonged to another person"),
        ("damaged", "The property was damaged or destroyed"),
        ("wilful", "It was done wilfully and unlawfully"),
        ("participation", "Evidence identifies the child as the person who did it"),
    ],
    "OTHER": [
        ("elements_identified", "Each element of the offence charged is identified in the file"),
        ("elements_proved", "There is evidence for each element"),
        ("participation", "Evidence identifies the child as the person who did it"),
    ],
}


def ingredients_for(incident_type):
    return INGREDIENTS.get(incident_type, INGREDIENTS["OTHER"])


def remand_limit(is_capital):
    return REMAND_LIMIT_CAPITAL if is_capital else REMAND_LIMIT_OTHER
