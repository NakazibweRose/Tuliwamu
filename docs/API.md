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
| POST | `/api/accounts/register/` | public community sign-up | 🗑 parked |

## Cases — Mary
| Method | Path | Who | Status |
|---|---|---|---|
| GET/POST | `/api/cases/?search=&status=&case_category=&district=` | POLICE, PSWO create; list is need-to-know | ✅ |
| GET/PATCH | `/api/cases/<id>/` | need-to-know | ✅ (🛠 minimised serializer for receivers) |
| PATCH | `/api/cases/<id>/status/` | ADMIN or assigned officer | ✅ |
| PATCH | `/api/cases/<id>/assign/` | ADMIN | ✅ |
| GET | `/api/cases/<id>/access-log/` | ADMIN, assigned officer | 🛠 Mary |
| `/api/reports/…`, `/api/child-relationships/…`, `/api/guardian/cases/` | | | 🗑 parked (replaced by public reports below) |

## Referrals & follow-ups — Rose
| Method | Path | Who | Status |
|---|---|---|---|
| GET/POST | `/api/referrals/` | POLICE/PSWO create for own cases; receivers see only theirs | ✅ |
| GET/PATCH | `/api/referrals/<id>/` | receiver may change `status`, `response_notes` only | ✅ (🛠 restrict fields + state machine) |
| GET | `/api/referrals/officers/` | staff. Recipients for the referral form | ✅ |
| GET/POST | `/api/referrals/follow-ups/?overdue=true` | | ✅ |
| GET/PATCH | `/api/referrals/follow-ups/<id>/` | assignee/ADMIN | ✅ |

Referral status flow (🛠): `PENDING → ACCEPTED | REJECTED`, `ACCEPTED → IN_PROGRESS → COMPLETED`.

## Public (anonymous) reports — Rose
| Method | Path | Who | Status |
|---|---|---|---|
| POST | `/api/referrals/ussd/` | Africa's Talking callback (form fields `sessionId, phoneNumber, text`) | ✅ |
| POST | `/api/public-reports/` | anyone, no login. Web form: `category, district, description, contact_phone?` → `{reference_code}` | 🛠 Rose |
| GET | `/api/public-reports/status/<reference_code>/` | anyone. Returns status only | 🛠 Rose |
| GET | `/api/public-reports/` | POLICE, PSWO, ADMIN. Triage inbox | 🛠 Rose |
| POST | `/api/public-reports/<id>/convert/` | POLICE, PSWO. Creates a Case, links it, sets status REFERRED | 🛠 Rose + Mary |

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
