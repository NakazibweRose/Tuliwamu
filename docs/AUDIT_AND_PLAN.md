# Tuliwamu: Audit & Build Plan (Hack4Justice 2026, Track 02: Juvenile Justice)

> **Challenge:** *How might we securely coordinate child-sensitive referrals and support services?*
> **Prototype opportunities:** (1) Protected intake + referrals, (2) Role-based access + alerts, (3) Anonymised reporting
> **Channels:** Web dashboard for institutions, plus Africa's Talking **USSD** (public reporting) and **SMS** (alerts)

---

## 1. Where the code actually is (as of 24 Nov)

`main` is behind. Most of the work sits on feature branches that haven't been merged:

| Branch | Owner | What it has | State |
|---|---|---|---|
| `main` | — | Case model, basic referral model, `User.role` | Out of date |
| `feature/member-1-auth` | Mary | JWT login, staff account management, `Child`, `ChildRelationship` (guardian verification), `CommunityReport` (logged-in reporting), case assignment and search, Swagger docs | Not merged |
| `feature/member2-referrals-ussd` | Rose | Referral linked to Case, receiving officer, status history, follow-ups, `PublicReport` (anonymous USSD), `Station`, USSD menu, **13 tests** | Not merged |
| `frontend-setup` | Daphine | React + Vite + Tailwind: Dashboard, Cases, Referrals, Deadlines, AI Assistant pages | **Mock data only.** No API calls, no login |
| `feature/ai-legal-assistant` | Dorcus | FastAPI RAG over the Children Act, Diversion Guidelines and JLOS SDP IV, using OpenRouter LLM + Postgres/pgvector, about 31 MB of PDFs | Separate service |

**Merge check (done in a scratch worktree):** `main` + `member-1-auth` + `member2-referrals-ussd` + `frontend-setup` merge with **no conflicts**. `makemigrations --check` shows nothing pending, and **all 13 tests pass**. The first step is safe.

**Not built yet:** any **SMS** sending, a `phone_number` on users, an institution model, an audit log, an anonymised statistics view, and a frontend connected to the API.

---

## 2. Keep / Change / Remove / Add

### KEEP (core of the challenge)
- `Case` with category (child victim vs child in conflict with the law) and incident-type validation. This is good domain modelling.
- `Referral`, `ReferralStatusHistory` and `ReferralFollowUp`. They are the backbone of "coordinate referrals and follow-up".
- `PublicReport` and the USSD menu (report concern, seek help, check status by reference code, phone number optional). This is the **anonymised reporting** story.
- JWT auth, staff account management by the admin, the Swagger docs, and Rose's tests.
- The frontend shell (layout, sidebar, Cases and Referrals pages). Keep it, but connect it to the API.

### CHANGE
| Item | Problem | Fix |
|---|---|---|
| Two public-report models (`cases.CommunityReport` and `referrals.PublicReport`) | They duplicate each other. `CommunityReport` **requires a login and the child's name**, which works against anonymity | Keep **`PublicReport` only** and give it a web submission form as well as USSD |
| `Station` plus free-text `referring_institution` / `receiving_institution` | The USSD inbox matches on name strings, which breaks easily and can be spoofed | Replace with an **`Institution`** model (type, district, phone) and make `User.institution` a foreign key |
| USSD "Institution access" | The caller's phone number alone counts as authentication | Add a **4-digit PIN** (stored hashed) and show only reference, status and age band. Never names. |
| Referral update | The receiving officer can PATCH `reason` and `referring_institution` | The receiver may change only `status` and `response_notes` |
| Referral status | Any transition is allowed (e.g. COMPLETED → PENDING) | Enforce a state machine: PENDING→ACCEPTED/REJECTED→IN_PROGRESS→COMPLETED |
| `CaseSerializer` uses `fields="__all__"` | Every viewer sees the child's name and full description | **Need-to-know serializers**: a receiving provider sees age band, category, district and reason. They see the full identity only **after ACCEPTING** the referral. |
| `Referral.__str__` | Crashes when `case` is null | Guard against null |
| `settings.py` | `DEBUG=True` and an ngrok hostname are hardcoded | Read both from `.env`, and add `.env.example` |
| Frontend "Deadlines" page | Mock data | Rename to **"Follow-ups"** and load `/api/referrals/follow-ups/?overdue=true` |

### REMOVE / PARK (outside the three prototype opportunities, or a risk)
| Item | Why |
|---|---|
| **`COMMUNITY` self-registration + `ChildRelationship` guardian verification + guardian case view** | Anyone can sign up and *claim* to be a parent. Officers then need a real identity check, which the MVP can't demo safely. It also creates a public login surface into child records. **Park as roadmap** and keep the code on its branch. |
| `cases.CommunityReport` | Replaced by `PublicReport` (see above) |
| **AI Legal Assistant in the core demo** | It doesn't map to any of the three opportunities. It sends text to a third-party LLM (OpenRouter free tier), so an officer pasting case details would create a data-protection problem. It needs Postgres + pgvector and 31 MB of PDFs. **Recommendation:** keep it off `main` and out of the 10-minute demo. Mention it in one sentence as roadmap ("procedural guidance on the Children Act and Diversion Guidelines, no case data"). See the decision in §7. |
| Hardcoded mock arrays in the frontend | Judges score "does it actually work as they say" (25 pts) |

### ADD (needed to score)
1. **SMS alerts via Africa's Talking.** Use the `africastalking` Python SDK in sandbox mode, behind a `notifications/` service with a console fallback so the demo works offline.
   - New referral → receiving officer: *"Tuliwamu: new referral REF-8F2A. Log in to view."* **No names, no case details.**
   - Status change → referring officer.
   - Public report → reporter's acknowledgement with reference code, **only if they opted in** to sharing their number.
   - Overdue follow-up → assigned officer (management command `send_overdue_reminders`).
   - Log every SMS in `NotificationLog` (recipient, template and status, not the message body with data).
2. **`Institution` model + `User.phone_number` + `User.institution`.**
3. **`AuditLog`**: who viewed or changed which case or referral, and when. Shown on the case page ("Access history"). This is our strongest point for the "Safe by design" and "ethics" criteria.
4. **Anonymised statistics endpoint + dashboard** (`/api/stats/`): counts by district, category, age band and status, plus median referral acknowledgement time. **Small-cell suppression:** any count under 5 shows as "<5". This covers the *other* meaning of "anonymised reporting" (aggregate reporting for oversight and policy) and gives us our KPIs live.
5. **Triage flow**: officer opens a `PublicReport` → "Convert to case" → "Refer". Links anonymous intake to protected referral.
6. **Frontend connected to the API**: login, role-aware sidebar, Cases, Referrals (accept/reject), Public Reports inbox, Follow-ups, Stats.
7. **Seed command** `python manage.py seed_demo` with **fictional** data only (the rules say no real personal data). Use clearly fake names like "Child A", phone numbers from the AT sandbox, and districts.
8. **Data-retention flag**: mark records for review N months after a case closes (we show the policy; deletion is roadmap).
9. **USSD hardening**: AT joins every input with `*`, so a `*` inside the description breaks parsing. Strip or handle it, cap lengths, and use a secret callback path token.

---

## 3. Roles for role-based access (final)

Principle: **least privilege + need-to-know**. Every read of child data is audit-logged.

| Role | Who in Uganda | Can do | Cannot do |
|---|---|---|---|
| **Public reporter** (no account) | Any community member, teacher, LC1, neighbour | Report a concern via USSD/web anonymously, check status with reference code, get "seek help" info | See anything except their own report's status |
| **`POLICE`**: Child & Family Protection Unit officer | Uganda Police CFPU | Triage public reports, register cases, refer, update cases assigned to them | See other officers' cases; see stats with small cells |
| **`PSWO`**: Probation & Social Welfare Officer | District local government (MGLSD mandate) | Same as police + is the default lead for children in conflict with the law (diversion) | Same |
| **`LEGAL_AID`**: Legal aid provider | ULS LADP, Justice Centres Uganda, FIDA-U, etc. | See referrals addressed to them (**minimised view**), accept/reject, add notes, complete follow-ups; full identity only after accepting | Create cases; see unrelated cases |
| **`SERVICE_PROVIDER`**: Support service (*new*) | Health facility, shelter, psychosocial NGO | Same as Legal Aid | Same |
| **`OVERSIGHT`**: Supervisor / M&E (*new*) | District Probation Officer supervisor, JLOS/JCU M&E | View **anonymised aggregate statistics only** | See any individual record |
| **`ADMIN`**: System administrator | Host institution ICT | Manage institutions and staff accounts (create, deactivate, change role), assign cases | Access to case content is audit-logged; ideally read-only |

Removed for MVP: `COMMUNITY` (web accounts for the public). Reporting stays anonymous via USSD and the web form instead.

---

## 4. Core workflows (demo script, about 6 of the 10 minutes)

```
 ① ANONYMOUS INTAKE (USSD *384*xxxx#, AT simulator on screen)
    Reporter → 1 Report → category → district → description → share number? 2 (No)
    ← "Received. Ref TUL-3F9A21…"
                │
 ② TRIAGE (web, logged in as CFPU Police)
    Public Reports inbox → open TUL-3F9A21 → "Convert to case" (child: "Child A", 14, Wakiso)
                │                                          [AuditLog: created]
 ③ PROTECTED REFERRAL
    Case → "Refer" → Institution: Justice Centres Uganda → Officer → reason
    ── SMS ──► Legal aid officer phone: "New referral REF-8F2A. Log in to view." (no names)
                │
 ④ ROLE-BASED ACCESS (log in as Legal Aid)
    Sees only this referral: age band 13–15, category, district, reason. Name hidden.
    "Accept" → name revealed → status history records it → SMS back to police officer
    Try to open another case → 404 (show it!)
                │
 ⑤ FOLLOW-UP
    Follow-up due in 7 days → overdue list → SMS reminder (management command)
                │
 ⑥ ANONYMISED REPORTING (log in as Oversight)
    Stats: reports by district, median time-to-acknowledge, % completed; "<5" suppression
    ⑦ Reporter dials USSD → 3 Check status → TUL-3F9A21 → "Referred"
```

---

## 5. Judging criteria → what covers each (100 pts)

| # | Criterion | Pts | Our evidence | Owner |
|---|---|---|---|---|
| 1–2 | Clear problem + **statistics** | 10 | Child referrals pass between Police CFPU, PSWO, legal aid and service providers on paper and phone, so they get lost, are slow, and expose children's identities. **Use real figures only.** Sources to pull from: *JLOS SDP IV* (already in `ai_service/legal_documents`), Uganda VACS 2015 (MGLSD/UBOS), Uganda Police Annual Crime Report (child-related offences), Judiciary case backlog census, UNICEF Uganda justice-for-children reports, Uganda Prisons/remand-home statistics. Cite each figure with source and year. | Research lead |
| 3–4 | Research questions + SMART objectives | 10 | RQs: (a) Where do child referrals break down between institutions? (b) How can a basic-phone user report safely and anonymously? (c) How do we share only what each actor needs to know? Objectives: e.g. "receiving institution acknowledges ≥80% of referrals within 48 h in pilot district"; "100% of child-record views audit-logged"; "0 child identifiers in SMS". | All |
| 5–6 | Why this idea / local fit | 10 | USSD works on any phone, needs no data bundle or smartphone, and the menus are short for low literacy (a Luganda menu is a stretch goal). SMS reaches officers in the field. It is a web app, not a mobile app, so there is no install. Existing alternatives: Sauti 116 helpline (voice, call centre, not inter-agency case tracking), paper referral forms, and WhatsApp groups (unsafe for child data). Tuliwamu **complements** 116 rather than replacing it. | All |
| 7 | Functional MVP | 25 (shared w/ 8) | The live demo in §4: real AT sandbox USSD + SMS, a frontend connected to the API, the tests run on screen | Devs |
| 8 | Legal & tech ethics | | **Data Protection and Privacy Act 2019** (+ Regulations 2021): consent, purpose limitation, minimisation, security safeguards, children's data needs parental/guardian consent or a lawful basis. **Children Act** (as amended 2016): best interests of the child, confidentiality of child proceedings, age of criminal responsibility 12, diversion. Our controls: anonymous reporting, opt-in phone number, no identifiers over SMS/USSD, need-to-know reveal, audit log, small-cell suppression, fictional demo data. **Be honest about limits:** phone-number + PIN is not strong authentication, SQLite isn't production, no encryption-at-rest yet. *(Verify the exact sections with a mentor or the docs before citing.)* | Ethics lead |
| 9–10 | Stakeholders & institutional fit | 10 | Users: Police CFPU, PSWOs, legal aid providers, service NGOs. Regulators: MGLSD, Personal Data Protection Office (NITA-U), JLOS/Justice Coordination Unit. Beneficiaries: children and families. Adoption: pilot in one district via the District Probation Office, which already convenes child-protection coordination; Tuliwamu digitises the existing referral pathway rather than inventing a new one. | Pitch lead |
| 11–12 | Viability + KPIs | 15 | Costs: USSD and SMS are pay-per-use (get AT's current UG rates; don't quote from memory). A small VPS, open-source stack, so the host is government/NITA-U data centre in the long run. Funding: JLOS/JCU, UNICEF Uganda, MGLSD partners, legal aid donors. **KPIs are shown live on the stats page:** median time-to-acknowledge, % of referrals completed, # anonymous reports, # overdue follow-ups, % reports converted to cases. | Pitch lead |
| 13–15 | Teamwork, mastery, confidence | 20 | Git history with per-member branches and PRs (see §6). Every member rehearses the full demo and can answer: *why anonymous? why no names in SMS? what does Legal Aid see vs Police? what law applies?* | All |

**2-page written submission:** Problem + stats, RQs + objectives, solution + workflow diagram, safeguards, stakeholders + adoption, viability + KPIs, team contributions.

---

## 6. Git workflow (so everyone's contribution shows)

1. **Integration branch** `develop`: merge the three code branches into it **with merge commits** (`git merge --no-ff`). This keeps every member's original commits and authorship. Already verified conflict-free.
2. Each person works on **their own short-lived branch off `develop`**, e.g. `feature/rose-sms-alerts`, `feature/mary-institution-rbac`, `feature/daphine-api-wiring`, `feature/dorcus-stats-dashboard`.
3. Open a **PR into `develop`**, have a teammate review it, then merge. The reviews also show up as contributions.
4. Commit small and often, with clear messages (`feat(referrals): restrict receiver updates to status/notes`).
5. Merge `develop` → `main` at **demo freeze** (tag `v1.0-demo`).
6. Never commit `.env`, `db.sqlite3` or real data. Add `backend/.env.example`.

---

## 7. Suggested task split

| Person | Day-1 build | Pitch role |
|---|---|---|
| **Rose** (referrals/USSD) | AT SMS service + NotificationLog, USSD PIN + hardening, referral state machine | Live USSD + SMS demo |
| **Mary** (auth/cases) | `Institution` model, new roles, need-to-know serializers, AuditLog, remove CommunityReport/guardian flow from main, seed_demo | RBAC + ethics Q&A |
| **Daphine** (frontend) | Login + role-aware nav, connect Cases, Referrals, Public Reports and Follow-ups to the API | Web demo driver |
| **Dorcus** (AI → data) | Stats endpoint + dashboard with small-cell suppression; **statistics research** from JLOS SDP IV and other sources; draft the 2-page submission | Problem + evidence + KPIs |

## 8. Decisions (agreed 24 Nov)
1. **AI assistant:** parked. It is not on `develop`/`main` and gets at most a one-line roadmap mention. Dorcus moves to stats, evidence and the submission.
2. **Guardian/community accounts:** parked as roadmap. The endpoints stay in the code for now and are marked 🗑 in `docs/API.md`; Mary removes them from the URLs in her RBAC PR.
3. **Integration:** `develop` was created from `main` with `--no-ff` merges of `feature/member-1-auth`, `feature/member2-referrals-ussd` and `frontend-setup`. All authorship is preserved, and all 13 tests pass.
