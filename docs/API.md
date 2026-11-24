# Tuliwamu API contract

This is the single source of truth between the backend and the frontend. **If you change an endpoint, update this file in the same PR.**
Live, auto-generated docs: run the backend and open `http://127.0.0.1:8000/api/docs/` (Swagger).

Auth: `POST /api/token/` with `{username, password}` returns `{access, refresh, role}`. Send `Authorization: Bearer <access>` on every call. Refresh via `POST /api/token/refresh/`.

Legend: ✅ exists on `develop` · 🛠 to build (owner) · 🗑 to be removed (parked)

## Accounts — Mary
| Method | Path | Who | Status |
|---|---|---|---|
| GET | `/api/accounts/profile/` | any logged-in user. Returns `id, username, first_name, last_name, role` + `role_display`, `institution`, `phone_number` | ✅ |
| POST | `/api/accounts/staff/` | ADMIN. Create staff account | ✅ |
| GET | `/api/accounts/staff/list/` | ADMIN | ✅ |
| PATCH | `/api/accounts/staff/<id>/status/` · `/role/` | ADMIN | ✅ |
| GET/POST | `/api/accounts/institutions/?type=LEGAL_AID` | GET: staff · POST: ADMIN | ✅ |

## Cases — Mary
| Method | Path | Who | Status |
|---|---|---|---|
| GET/POST | `/api/cases/?search=&status=&case_category=&district=` | POLICE, PSWO, ADMIN create. Readers: ADMIN, POLICE, PSWO, LEGAL_AID, SERVICE_PROVIDER, each seeing only their cases. OVERSIGHT → 403 | ✅ |
| GET/PATCH | `/api/cases/<id>/` | GET: need-to-know (see below). PATCH: ADMIN | ✅ |
| PATCH | `/api/cases/<id>/status/` | ADMIN or assigned officer | ✅ |
| PATCH | `/api/cases/<id>/assign/` | ADMIN | ✅ |
| GET | `/api/cases/<id>/access-log/` | ADMIN, registering or assigned officer → `[{user, user_role, action, detail, created_at}]` | ✅ |

**Need-to-know case view.** Every case has `identity_visible`.
- `true` (admin, registering/assigned officer, or a receiver whose referral is ACCEPTED/IN_PROGRESS/COMPLETED): the full record.
- `false` (a receiver before accepting): only `id, reference_number, case_category, incident_type, age_band, district, status, created_at, identity_visible`. **No name, no description.** The frontend should show "Identity hidden until you accept the referral".

Receivers' `?search=` matches district only. Every case view and change is written to the audit log.

## Referrals & follow-ups — Rose
| Method | Path | Who | Status |
|---|---|---|---|
| GET/POST | `/api/referrals/` | POLICE/PSWO/ADMIN create for their own cases (`case, receiving_officer, reason`; institution names are filled from the officers' institutions). Receivers see only their own. Response includes `receiving_officer_name`, `referred_by_name` | ✅ |
| GET/PATCH | `/api/referrals/<id>/` | the receiver may change only `status` and `response_notes` (a reason is required to reject); ADMIN may change any field | ✅ |
| GET | `/api/referrals/officers/` | POLICE/PSWO/ADMIN. Recipients (`id, username, first_name, last_name, role, institution`); other roles get `[]` | ✅ |
| GET/POST | `/api/referrals/follow-ups/?overdue=true` | | ✅ |
| GET/PATCH | `/api/referrals/follow-ups/<id>/` | assignee/ADMIN | ✅ |

Referral status flow (enforced): `PENDING → ACCEPTED | REJECTED`, `ACCEPTED → IN_PROGRESS → COMPLETED`.

## Public (anonymous) reports — Rose
| Method | Path | Who | Status |
|---|---|---|---|
| POST | `/api/referrals/ussd/` | Africa's Talking callback (form fields `sessionId, phoneNumber, text`) | ✅ |
| POST | `/api/public-reports/` | anyone, no login, 30/hour. `category` (PROTECTION, NEGLECT, VIOLENCE, OTHER), `district`, `description`, optional `contact_phone` → `{reference_code, status, …}` | ✅ |
| GET | `/api/public-reports/status/<reference_code>/` | anyone. Returns `reference_code, status, status_display` only | ✅ |
| GET | `/api/public-reports/?status=&category=&channel=&district=` | POLICE, PSWO, ADMIN. Triage inbox | ✅ |
| GET/PATCH | `/api/public-reports/<id>/` | POLICE, PSWO, ADMIN. PATCH `status` to UNDER_REVIEW or CLOSED | ✅ |
| POST | `/api/public-reports/<id>/convert/` | POLICE, PSWO, ADMIN. Body: `case_category, incident_type, child_name, child_age, incident_date, assigned_officer?` → `{report, case}`. District + description are copied from the report; the report becomes REFERRED | ✅ |

## SMS alerts — Rose (`backend/notifications/`)
Function `send_sms(phone, template_key, **context)`. Templates must **never** contain child names or case details.
Triggers: new referral → receiver · status change → referrer · opt-in public report → reporter · overdue follow-up → assignee.

## Anonymised statistics — Dorcus (`backend/stats/`)
| Method | Path | Who | Status |
|---|---|---|---|
| GET | `/api/stats/summary/` | OVERSIGHT, ADMIN | 🛠 Dorcus |

Proposed response (agree before building):
```json
{
  "reports_total": 42,
  "reports_by_district": [{"district": "Wakiso", "count": 12}, {"district": "Gulu", "count": "<5"}],
  "cases_by_category": [{"category": "CHILD_PROTECTION", "count": 20}],
  "referrals_by_status": [{"status": "COMPLETED", "count": 9}],
  "median_hours_to_acknowledge": 6.5,
  "percent_referrals_completed": 41.0,
  "overdue_follow_ups": 3
}
```
Any count from 1 to 4 is returned as the string `"<5"` (small-cell suppression).
