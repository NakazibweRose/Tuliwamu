# Tuliwamu frontend

React 19 + Vite + Tailwind. It talks to the Django API in `../backend`.

```bash
npm install
npm run dev        # http://localhost:5173 (proxies /api to http://127.0.0.1:8000)
npm run lint
npm run build
```

- Point the dev proxy at another backend with `VITE_BACKEND_URL=http://host:port` in `frontend/.env`.
- For a deployed build served from a different origin, set `VITE_API_URL`.
- Sign in with the fictional demo accounts from `python manage.py seed_demo` (see the root README).

## Structure
| Path | What |
|---|---|
| `src/api.js` | axios client: JWT in sessionStorage (cleared when the browser closes), refresh on 401, readable errors |
| `src/auth.jsx`, `src/useAuth.js` | login state and the current user's profile |
| `src/menu.js` | which pages each role sees (the backend enforces the same rules) |
| `src/pages/ReportConcern.jsx` | public anonymous report + status check (no login) |
| `src/pages/PublicReports.jsx` | triage inbox and "convert to case" |
| `src/pages/Cases.jsx`, `src/components/CaseDetail.jsx` | cases, need-to-know view, refer, access log |
| `src/pages/Referrals.jsx` | received/sent referrals, accept/decline/progress |
| `src/pages/FollowUps.jsx` | follow-up tasks, overdue filter |
| `src/pages/Stats.jsx` | anonymised statistics for Oversight |
| `src/pages/Staff.jsx` | admin: staff accounts and institutions |
