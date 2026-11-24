# Tuliwamu: pitch and demo plan (10 min + 2 min Q&A)

The order follows the judging sheet, so the judges can tick boxes as we go. Each member presents the part they built (criterion 13). **Every number comes from `docs/EVIDENCE.md`.** Confirm the 🔎 ones before you say them.

## Run sheet

| Time | Slide / action | Speaker | Key lines (criteria covered) |
|---|---|---|---|
| 0:00–1:15 | **1. The problem** | Dorcus | "When a child is abused or arrested, help depends on four institutions acting together: police, probation, legal aid and support services. Today that hand-off is paper, phone calls and WhatsApp. The Ministry of Gender's own handbook names the failure: *slow or non-responsiveness to cases referred, and poor documentation along the referral pathway*." **Numbers:** 3 in 4 young adults experienced violence in childhood (VACS 2018). Child-related offences up 27% (JLOS SDP IV). Children on remand at double the target (JLOS SDP IV). *(1, 2)* |
| 1:15–2:00 | **2. Questions and objectives** | Dorcus | Three research questions. Four objectives: ≥80% of referrals acknowledged in 48h; ≥60% completed; ≥30% of reports by USSD; zero child identifiers in any SMS. *(3, 4)* |
| 2:00–3:00 | **3. Why this design** | Rose | "56% of phones in use are feature phones (UCC 2024), so reporting is USSD, not an app. Officers are in the field, so alerts go by SMS. We left out a smartphone app, parent self-registration and AI on case data, each for a stated reason. We complement Sauti 116: they take the call, we coordinate the referral after it." *(5, 6)* |
| 3:00–7:00 | **4. LIVE DEMO** (see the script below) | Rose (USSD) → Mary (police and privacy) → Daphine (legal aid and UI) | *(7: working MVP)* |
| 7:00–8:00 | **5. Safe by design** | Mary | The Children Act Cap 62, s.148 privacy duty is the reason for: no names in SMS or USSD, a minimised view until acceptance, the access log, and suppression of small counts. Lawful basis: the legal duties in ss.37, 66 and 134, which match the exceptions in DPPA 2019 s.8. Honest limits: phone-number trust on USSD, no encryption at rest yet, PDPO registration needed before a pilot. *(8)* |
| 8:00–9:00 | **6. Who uses it and how it gets adopted** | Daphine | Users: CFPU, PSWOs, legal aid providers, shelters. Owners and regulators: MGLSD, PDPO/NITA-U, JLOS J4C, the Judiciary. Pilot through one District Probation Office: onboard in week 1, run alongside paper for weeks 2–24, then review the KPIs. *(9, 10)* |
| 9:00–10:00 | **7. Viability and how we'll know it works** | Dorcus | Open source plus pay-per-use SMS/USSD, so cost grows with use. Funding: JLOS J4C, UNICEF, legal aid donors, district budgets. **Show the live Statistics page:** these are the KPIs the pilot will be judged on. Close: "Tuliwamu means *we are together*. Every institution, one referral, and the child's identity protected at every step." *(11, 12)* |

## Live demo script (4 minutes)

**Before going on stage:** run `python manage.py seed_demo --reset`. Open three browser windows, each already on the login page, and the Africa's Talking simulator. Make the font large (Ctrl +).

| # | Who / screen | Do this | Say this |
|---|---|---|---|
| 1 | Rose · AT USSD simulator | Dial the code → **1 Report** → 3 Violence → "Wakiso" → short description → **2 No** (stay anonymous). Read out the reference code. | "Any phone, no data, no name. The reporter keeps only a code." |
| 2 | Mary · window 1, `police.wakiso` | **Public Reports** → find the code → **Convert** → fill in a fictional child ("Child Z", 9) → **Create case**. | "The CFPU officer triages and converts the report. This is the PSWO/police inquiry under Children Act s.66." |
| 3 | Mary · same case dialog | **Refer** → *Demo Legal Aid Clinic: Advocate Kato* → reason → **Send**. Show the SMS arriving (AT sandbox / console): *"new referral … log in to view"*. | "The SMS carries no name and no details." |
| 4 | Daphine · window 2, `legalaid` | **Referrals** → click the case reference → show **🔒 Identity hidden** with age band only → close → **Accept** → open the case again: the name is now visible. | "Need-to-know: legal aid sees the identity only after they commit to helping." |
| 5 | Daphine | Show **Follow-ups** with an overdue item. | "Nothing falls through the cracks." |
| 6 | Mary · window 1 | Open the case → **Access history**: shows that `legalaid` viewed the minimised record, then the full record. | "Every look at a child's file is logged." |
| 7 | Rose · USSD | Dial → **3 Check status** → enter the code → "Referred". | "The reporter sees progress, nothing more." |
| (if time) | Dorcus · window 3, `oversight` | Statistics page; point at a "<5" hatched bar. | "Oversight sees trends, never children." |

**Backup:** record a screen video of this script tonight. If the Wi-Fi or ngrok fails, play the video and keep talking. The web "Report a concern" page (no login) can stand in for USSD.

## Likely judge questions (everyone should be able to answer these)

| Question | Answer |
|---|---|
| **Is this legal? You're processing children's data.** | Yes. The Children Act places duties to report (s.37), inquire (s.66) and notify on arrest (s.134). DPPA s.8 allows processing children's data without parental consent where it's needed to comply with the law. We minimise data, log access, and would register with the PDPO before a pilot. |
| **What stops an officer browsing children's files?** | They see only cases they registered, are assigned to, or were referred. Receivers see a minimised view until they accept. Every view is in an append-only log that the case owner can read. |
| **Why not just use Sauti 116 or WhatsApp?** | Sauti 116 is a call centre for reporting and counselling; we coordinate the multi-agency referral that comes after. WhatsApp has no access control, no audit trail, and spreads children's photos and names. |
| **What if the reporter is lying or malicious?** | Public reports land in a triage inbox, not straight into a case. An officer verifies before converting, and can close false reports. Submissions are rate-limited. |
| **USSD login by phone number is weak.** | Agreed. That's why USSD institution access shows only reference and status, never identity. We're adding a PIN, and full case access is only on the web login. |
| **What does it cost?** | Hosting on one small server or a NITA-U data centre. SMS and USSD are pay-per-use through Africa's Talking, tens of shillings per SMS (exact rate card from AT). No licence fees. |
| **Who pays after the hackathon?** | Pilot funding from the JLOS Justice for Children programme and child-protection partners (UNICEF, legal aid donors). Long term, the Ministry and districts as part of probation operations. |
| **How will you know it works?** | The Oversight dashboard measures it live: median hours to acknowledge, % acknowledged within 48h, % completed, overdue follow-ups, and reports by channel. The pilot targets are on our objectives slide. |
| **What about children in conflict with the law?** | The same flow. Police notify probation fast (the s.134 24-hour limit), and remand limits (s.136: 45 days / 3 months) can be tracked as follow-ups. Age bands split at 12, the age of criminal responsibility (s.133). |
| **Is the data real?** | No. All demo data is fictional, as the rules require. |
| **What did each of you build?** | Each person answers for their own part (see the submission, §8). |
| **What's next?** | A PIN for USSD, encryption at rest, Luganda and other language menus, deadline alerts for remand limits, and a PDPO registration plus data-sharing protocol for a pilot district. |

## Slide checklist (7 slides, one idea each)
1. Problem + 3 numbers + the MGLSD quote
2. Research questions + 4 objectives
3. Design choices: included / excluded / local context
4. "Live demo": a single slide showing the flow (Report → Triage → Refer → Accept → Follow-up → Oversee)
5. Safe by design (privacy, lawful basis, audit, honest limits)
6. Stakeholders + pilot adoption path
7. Viability + KPIs + team (names and roles), closing line
