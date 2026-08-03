# EduPredict — Security Review

This project was audited against a general-purpose web app security
checklist. Status of each applicable item:

| # | Check | Status | Notes |
|---|---|---|---|
| 1 | API keys not in frontend code | ✅ | Only a public API base URL ships to the client; secrets (Mongo URI, Flask secret, admin setup key) live in server-side env vars |
| 2 | DB queries don't run in the browser | ✅ | All MongoDB access is server-side (Flask/PyMongo); the frontend only calls REST endpoints |
| 3 | Authentication actually works | ✅ | Session-based auth, password hashing (werkzeug), tested unauthenticated/wrong-role access is rejected |
| 4 | No sensitive data in URLs | ✅ | Credentials and tokens are sent in POST bodies, never query strings |
| 5 | File uploads validated and restricted | ✅ | CSV/JSON only, 5 MB request cap (`MAX_CONTENT_LENGTH`), row-level validation |
| 6 | Server-side input validation | ✅ | Role/percentage/password-length checks enforced server-side, not just in the UI |
| 7 | Injection protection | ✅ | MongoDB (no SQL); user search input is regex-escaped before use in `$regex` queries to prevent NoSQL/ReDoS injection |
| 8 | XSS prevention | ✅ | React escapes rendered output by default; no `dangerouslySetInnerHTML` anywhere in the app |
| 9 | Rate limiting on auth endpoints | ✅ | In-memory per-IP limiter on login/register/admin-setup (see `app.py`) |
| 10 | CORS not wildcard | ✅ | Restricted to a single configured `FRONTEND_ORIGIN`, never `*` |
| 11 | Passwords hashed | ✅ | `werkzeug.security.generate_password_hash` / `check_password_hash` |
| 12 | Error messages don't leak internals | ✅ | Row-level ingestion errors return a generic message instead of raw exception text |
| 13 | Dependencies reasonably current | ⚠️ | Pinned to recent stable versions at time of writing; not continuously monitored (no Dependabot on this repo) |
| 14 | Payment logic server-side | N/A | No payment functionality in this project |
| 15 | Admin routes have server-side role checks | ✅ | `login_required(roles=[...])` enforced on every privileged route, verified with automated tests |
| 16 | HTTPS enforced | ✅ | Provided by the hosting platforms (Render + Vercel terminate TLS automatically) |
| 17 | Security headers set | ✅ | `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` on every response |
| 18 | Session tokens secure | ✅ | `HttpOnly`, `Secure`, `SameSite=None` (required for the cross-origin frontend/backend split) |
| 19 | Logging doesn't include sensitive data | ✅ | No passwords or tokens are printed/logged anywhere |
| 20 | Database backups exist | ⚠️ | MongoDB Atlas free tier doesn't include automated backups; a manual export script (`backend/backup_db.py`) is provided as a practical substitute |
| 21 | Env vars not committed to git | ✅ | `.gitignore` excludes `.env`; all secrets are read via `os.environ` |
| 22 | Third-party integrations use least privilege | N/A | Single MongoDB user scoped to its own database; no other third-party integrations |
| 23 | Webhook signature verification | N/A | No webhooks in this project |
| 24 | User data deletion works | ❌ | Not implemented — self-service account deletion was intentionally left out of scope for this project |
| 25 | Tested as an attacker | ✅ | Verified: unauthenticated access to protected routes, cross-role access, privilege-escalation via registration, and brute-force behavior |

## Known, accepted limitations (course/portfolio project scope)

- **No distributed rate limiting** — the limiter is in-process memory,
  fine for a single Render instance but wouldn't share state across
  multiple horizontally-scaled instances.
- **No automated dependency scanning** — recommend running `npm audit`
  and `pip-audit` periodically if this evolves into a longer-lived
  project.
- **No formal penetration test** — the "tested as an attacker" item
  above reflects manual verification of the specific flows in this
  app, not a professional security audit.
