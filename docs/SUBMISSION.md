# Tuliwamu: secure coordination of child-sensitive referrals
**Hack4Justice 2026 · Track 02: Juvenile Justice** · Team: Rose Nakazibwe, Mary Achero, Daphine Nakandi, Dorcus Tumulamye

## 1. Problem
When a child is abused, neglected or arrested in Uganda, help depends on several institutions acting together: Police Child & Family Protection Units (CFPU), Probation & Social Welfare Officers (PSWOs), legal aid providers and support services. Today that hand-off happens on paper, by phone and in informal chats. The Ministry of Gender's own case-management handbook names the result: *"slow or non-responsiveness by government agencies to the cases referred; poor documentation and storage of information on cases handled by actors along the referral pathway"* (MGLSD, 2016). The ODPP calls the *"acute lack of Probation Officers"* one of the biggest challenges to child-friendly justice. The scarce officers we have lose time to chasing referrals. JLOS SDP IV describes sector processes as *"largely manual"*, with high lead times.

The need is large. Three in four young Ugandan adults experienced violence in childhood (VACS 2018). Child-related offences rose 27% between 2009 and 2013 (JLOS SDP IV). Children on remand stood at 2.07 per 100,000 against a target of 1 (JLOS SDP IV), and remand homes now hold far more children than their capacity (Judiciary, 2026). Every referral that stalls means a child waits longer for protection, legal help or diversion. *(Full citations: `docs/EVIDENCE.md`.)*

## 2. Research questions and objectives
**Questions.** (1) Where do child referrals break down between institutions? (2) How can anyone, including people with only a basic phone, report a concern safely and anonymously? (3) How can each institution see only what it needs to know about a child, while every access stays accountable?

**Objectives (pilot district, 6 months):**

- **O1 Speed:** receiving institutions acknowledge ≥80% of referrals within 48 hours (measured from referral to accept/decline).
- **O2 Follow-through:** ≥60% of accepted referrals reach "completed", and no follow-up stays overdue for more than 7 days.
- **O3 Access:** ≥30% of public reports arrive by USSD from feature phones.
- **O4 Privacy:** 0 child identifiers in any SMS/USSD message; 100% of child-record views are logged.

## 3. Why this idea (ideation rationale)
**Included**, because the challenge and the evidence call for them: protected intake and referrals with a full status history; role-based, need-to-know access with SMS alerts; anonymous reporting plus anonymised statistics.

**Excluded on purpose:** a smartphone app (feature phones are 56% of devices in use, UCC 2024); self-registered parent accounts (identity can't be verified safely in an MVP); an AI assistant (risk of case data reaching third parties).

**Fit with what exists:** Tuliwamu complements the Sauti 116 helpline. Sauti takes calls; Tuliwamu coordinates the referral that follows. It digitises the referral pathway districts already use rather than inventing a new one.

**Local context:** USSD needs no data bundle or smartphone; short numbered menus suit low-literacy users; the dashboard runs in any browser with no install; SMS reaches officers in the field.

## 4. Prototype and how it works (working MVP)
| Step | Who | What happens |
|---|---|---|
| 1. Report | Any community member | Dials the USSD code (Africa's Talking) or uses the web form. No name is needed and the phone number is optional. They get a reference code to check the status. |
| 2. Triage | Police CFPU / PSWO | Reviews the report and converts genuine concerns into a protected case (Children Act Cap 62, s.66). |
| 3. Refer | Police CFPU / PSWO | Refers the case to legal aid, probation or a support service. The receiver gets an **SMS with no child details**. |
| 4. Accept | Receiving officer | Sees only age band, category, district and reason. **The child's identity appears only after they accept.** |
| 5. Follow up | Both | Status history, follow-up tasks and overdue reminders. |
| 6. Oversee | M&E / supervisor | Sees **anonymised statistics only**, with any count under 5 suppressed. |

**Built with** Django REST + React, 49 automated tests and fictional demo data only. **Roles:** Administrator, Police (CFPU), PSWO, Legal Aid, Support Service Provider, Oversight, and Public reporter (no account).

## 5. Safe by design: legal and technology ethics

- **Lawful basis.** We process children's data to fulfil legal duties: reporting (s.37), PSWO inquiry (s.66), and notification on arrest (s.134, Children Act Cap 62). This matches the exceptions in s.8 of the Data Protection and Privacy Act 2019. Statistics are aggregate-only.
- **Privacy (Children Act s.148).**
  - Names never travel by SMS or USSD.
  - Receivers see a minimised record until they accept.
  - Search can't be used to find hidden names.
  - Small counts are suppressed in reports.
- **Accountability.** An append-only access log records every view and change, and officers can see who opened a case. Every referral status change is recorded.
- **Least privilege.**
  - Seven roles, each enforced on the server, not just hidden in the interface.
  - Only administrators create accounts, and an account without a role gets no access.
  - Logins expire when the browser closes.
- **Honest limits.**
  - USSD institution access currently trusts the caller's phone number (a PIN is being added); both are weaker than the web login.
  - There is no encryption at rest yet (SQLite in the demo).
  - Before a pilot we must register with the Personal Data Protection Office and agree a data-sharing protocol with each institution.

## 6. Stakeholders and institutional fit
**Users:** Police CFPU, district PSWOs, legal aid service providers (e.g. LASPNET members), shelters, health and psychosocial services. **Regulators and owners:** Ministry of Gender, Labour and Social Development; Personal Data Protection Office (NITA-U); JLOS Justice for Children programme; the Judiciary (Family and Children Courts). **Beneficiaries:** children, families and community reporters.

**Adoption path:** a pilot in one district through the District Probation Office, which already convenes child-protection actors. Week 1: onboard institutions and officers. Weeks 2–24: run live alongside the paper process. Then review the KPIs and hand over to the Ministry for scale-up.

## 7. Viability, funding and measuring success
**Cost:** an open-source stack on a small cloud server or a government data centre (NITA-U). SMS and USSD are pay-per-use through Africa's Talking (tens of shillings per SMS), so cost grows with use, not licences. **Funding:** JLOS Justice for Children programme, UNICEF Uganda and child-protection donors, legal aid funders, district budgets for scale-up. **Maintenance:** a standard Django/React codebase with automated tests, fictional seed data for training, and documented APIs.

**KPIs (live on the Oversight dashboard):** median hours to acknowledge a referral; % acknowledged within 48h; % of referrals completed; % of reports converted to cases; referrals pending over 48h; overdue follow-ups; reports by channel and district.

## 8. Team contributions

- **Rose Nakazibwe:** referral backend, status history and follow-ups, USSD reporting flow, Africa's Talking SMS/USSD.
- **Mary Achero:** case management, accounts and roles, need-to-know access, audit log, report triage and statistics APIs, integration and demo data.
- **Daphine Nakandi:** frontend design and pages (dashboard, cases, referrals, role-based navigation).
- **Dorcus Tumulamye:** research and evidence, legal-document analysis (Children Act, Diversion Guidelines, JLOS SDP IV), KPIs, submission and pitch.
