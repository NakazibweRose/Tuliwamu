# Tuliwamu: Child Justice Link

Hack4Justice 2026 · Track 02 Juvenile Justice: *How might we securely coordinate child-sensitive referrals and support services?*

Protected intake and referrals between Police CFPU, Probation & Social Welfare Officers, legal aid and support services. It has role-based access with SMS alerts and anonymous public reporting over USSD (Africa's Talking).

- Plan and audit: [`docs/AUDIT_AND_PLAN.md`](docs/AUDIT_AND_PLAN.md)
- API contract: [`docs/API.md`](docs/API.md)

## Run it

**Backend** (Python 3.12+)
```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # then set DJANGO_SECRET_KEY
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```
API docs: http://127.0.0.1:8000/api/docs/ · Tests: `python manage.py test`

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

**USSD (Africa's Talking sandbox):** run `ngrok http 8000`, add the ngrok host to `DJANGO_ALLOWED_HOSTS` in `.env`, and set the sandbox USSD callback to `https://<ngrok-host>/api/referrals/ussd/`.

> ⚠️ Demo data must be fictional. Never enter real children's or reporters' details.

## Team workflow
- `main`: demo-ready only. Updated once at code freeze, tagged `v1.0-demo`.
- `develop`: the integration branch. All PRs go here.
- Your work goes on `feature/<name>-<topic>`, branched from the latest `develop`.

```bash
git checkout develop && git pull
git checkout -b feature/rose-sms
# ...work, small commits...
git push -u origin feature/rose-sms   # then open a PR into develop
```

Rules:
1. Stay in **your own area** (see the table below). Shared files (`config/settings.py`, `config/urls.py`, `requirements.txt`) get only one- or two-line changes per PR.
2. Run `makemigrations` only right after pulling `develop`. Never edit another person's models.
3. Tests must pass before you open a PR. A teammate reviews before merging.
4. If you change an endpoint, update `docs/API.md` in the same PR.

| Member | Area | Builds |
|---|---|---|
| Mary | `backend/accounts/`, `backend/cases/` | Institution model, roles, phone numbers, access log, need-to-know views, `seed_demo` |
| Rose | `backend/referrals/`, `backend/notifications/` | Africa's Talking SMS, USSD PIN + hardening, referral status rules, public-report web API + triage |
| Daphine | `frontend/` | Login, role-aware navigation, pages connected to the API |
| Dorcus | `backend/stats/`, `docs/` | Anonymised statistics API + page, evidence research, 2-page submission |
