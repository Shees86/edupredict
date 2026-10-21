# Security

Notes on the security-relevant decisions in this codebase, for anyone
reviewing or extending it.

## Authentication & sessions

- Passwords are hashed with `werkzeug.security` (never stored or logged
  in plaintext).
- Sessions are cookie-based (`HttpOnly`, `Secure`, `SameSite=None` to
  support the cross-origin frontend/backend split), with a 30-minute
  idle timeout by default. Configure `SESSION_IDLE_TIMEOUT_SECONDS` to
  change the timeout.
- Admin accounts cannot be created through public self-registration —
  only through a separate endpoint gated behind an `ADMIN_SETUP_KEY`
  environment variable, so no client-side path exists for a user to
  grant themselves elevated privileges.
- Login, registration, and password-reset endpoints are rate-limited
  per IP to slow brute-force and credential-stuffing attempts. The
  limiter uses the TCP peer address; `X-Forwarded-For` is only applied
  (via Werkzeug ProxyFix, last hop) when `TRUST_PROXY` is on or the
  process is running on Render.
- `/api/auth/forgot-password` always returns the same success message
  and never includes the reset token in the JSON body. The token is
  stored server-side and emailed when SMTP is configured.
- Student self-registration requires a matching roster Student ID, an
  email that matches the roster when one is on file, and admin approval
  before the account can log in.
- Optional TOTP-based two-factor authentication (`pyotp`), compatible
  with authenticator apps.
- TOTP secrets and password-reset tokens are encrypted in MongoDB with
  Fernet using `APP_ENCRYPTION_KEY`. This key is required for storing or
  reading those encrypted authentication secrets. Generate a persistent
  Fernet key with
  `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`
  and store it securely in the deployment's secret manager. **Never
  change or rotate `APP_ENCRYPTION_KEY`** after it has encrypted data:
  existing encrypted values become unreadable without the original key.
  Existing plaintext values are encrypted during application startup.
- Passwords must be at least 10 characters and contain at least one
  letter and one digit.

## Data access

- All MongoDB access happens server-side; the frontend only talks to
  the REST API, never the database directly.
- User-supplied search input is regex-escaped before use in Mongo
  `$regex` queries to prevent injection and catastrophic-backtracking
  (ReDoS) patterns.
- Role checks (`login_required(roles=[...])`) are enforced on every
  privileged route server-side — the UI hides options a role
  shouldn't see, but the API is the actual boundary.
- Student data uploads accept CSV or JSON, are capped at 5 MB per
  request, and are validated row-by-row before being written to the
  database.

## Transport & headers

- HTTPS is terminated by the hosting platform (Render/Vercel).
- CORS is restricted to the comma-separated origins configured in
  `FRONTEND_ORIGIN` — never a wildcard.
- Every response receives `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: DENY`, `Strict-Transport-Security`,
  `Referrer-Policy: no-referrer`, and a restrictive
  `Content-Security-Policy`.

## Secrets

- No API keys or credentials are shipped to the client; the frontend
  only receives a public API base URL.
- Runtime settings are read from environment variables. Important
  secrets include `MONGO_URI`, `FLASK_SECRET_KEY`, `ADMIN_SETUP_KEY`,
  `APP_ENCRYPTION_KEY`, and optional SMTP credentials.

## Known limitations

- The rate limiter is in-process memory — fine for a single backend
  instance, but wouldn't share state if this were horizontally scaled
  across multiple instances.
- No automated dependency scanning is configured; run `npm audit` and
  `pip-audit` periodically if this grows into a longer-lived project.
- The repository does not configure automated database backups;
  `backend/backup_db.py` provides a manual export.
- There is no self-service account deletion flow. Student-record deletion
  is available in-app to admins and teachers, subject to teacher scope.
