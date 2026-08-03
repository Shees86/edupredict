# EduPredict — New Features (Latest Update)

15 new features added on top of the core system. All are free — no
paid services required. SMS alerts (Twilio) were intentionally
**not** implemented since that requires a paid account; everything
below works with free tooling only.

## Works out of the box (no extra setup)
- **Dark mode** — toggle in the top nav / landing page (☾/☀ icon), persists via browser storage
- **Urdu/English toggle** — top nav (اردو/EN); covers navigation, section headers, and the landing page hero. Not every microcopy string is translated yet.
- **Student progress goals** — Student dashboard, "My Goal" card (set attendance/GPA/score target)
- **Achievement badges** — auto-computed from each student's own record, shown on their dashboard
- **Role approval workflow** — Teacher/Analyst signups now require Admin approval (Admin dashboard → "Pending Account Approvals"); Student signups still work immediately (already gated by requiring an existing roster record)
- **Audit log** — Admin dashboard, shows who did what and when
- **Advanced filters** — `/api/students` now accepts `attendance_min`, `attendance_max`, `gpa_min`, `gpa_max`, `risk=high|safe` query params
- **Cohort comparison** — Analyst dashboard, compare two groups (e.g. high-risk vs safe) side by side
- **CSV export** — "Export CSV" button on the Admin student register
- **Notification preferences** — Settings (top nav "Settings" button) — toggle email/in-app alerts
- **In-app messaging** — backend routes ready (`/api/messages`, `/api/messages/conversations`); no dedicated inbox UI yet — can be added on request
- **2FA (TOTP)** — Settings → "Enable 2FA". Works with Google Authenticator/Authy (enter the shown secret manually, no QR image needed)
- **Password reset** — "Forgot password?" link on the login screen. Without SMTP configured, the reset token is shown directly on-screen for testing.

## Needs one environment variable to fully activate
- **Email alerts** (high-risk notifications + password reset emails) — set these on Render:
  | Key | Example |
  |---|---|
  | `SMTP_HOST` | `smtp.gmail.com` |
  | `SMTP_PORT` | `587` |
  | `SMTP_USER` | your email address |
  | `SMTP_PASSWORD` | an **app password** (not your normal password — Gmail/most providers require this for SMTP) |
  | `SMTP_FROM` | same as `SMTP_USER`, or a "from" address your provider allows |

  Without these set, the app still works normally — it just skips
  sending the email and logs a note to the server console instead
  (password reset still works via the on-screen token fallback).

## Setup reminder
```bash
cd backend
pip install -r requirements.txt   # now includes pyotp for 2FA
```
```bash
cd dashboard-app
npm install                        # framer-motion + three already added previously
```
