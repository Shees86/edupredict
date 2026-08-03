"""
EduPredict - Email notifications
====================================
Uses Python's built-in smtplib (no paid API, no extra package) to
send high-risk alerts and password-reset links.

Configure via environment variables:
    SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM

Works with any standard SMTP provider — a Gmail "app password", or a
free-tier transactional email service (e.g. Brevo/SendGrid's free
tier SMTP credentials both work here).

If SMTP isn't configured, every call here simply logs to the console
and returns False instead of raising — so the rest of the app keeps
working normally even with no email set up (e.g. during local dev).
"""

import os
import smtplib
from email.mime.text import MIMEText

SMTP_HOST = os.environ.get("SMTP_HOST")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD")
SMTP_FROM = os.environ.get("SMTP_FROM", SMTP_USER or "no-reply@edupredict.local")


def is_configured():
    return bool(SMTP_HOST and SMTP_USER and SMTP_PASSWORD)


def send_email(to_address, subject, body):
    if not is_configured():
        print(f"[emailer] SMTP not configured — would have sent to {to_address}: {subject}")
        return False
    try:
        msg = MIMEText(body)
        msg["Subject"] = subject
        msg["From"] = SMTP_FROM
        msg["To"] = to_address

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_FROM, [to_address], msg.as_string())
        return True
    except Exception as e:
        print(f"[emailer] Failed to send email to {to_address}: {e}")
        return False


def send_high_risk_alert_email(to_address, student_id, probability):
    subject = f"EduPredict Alert: {student_id} flagged as high dropout risk"
    body = (
        f"Student {student_id} has been flagged as HIGH DROPOUT RISK "
        f"(model confidence: {probability:.0%}).\n\n"
        f"Log in to EduPredict to review their record and next steps."
    )
    return send_email(to_address, subject, body)


def send_password_reset_email(to_address, reset_token, frontend_url):
    subject = "EduPredict — Password reset request"
    reset_link = f"{frontend_url}/?reset_token={reset_token}"
    body = (
        f"Someone requested a password reset for your EduPredict account.\n\n"
        f"Reset link (valid for 30 minutes): {reset_link}\n\n"
        f"If you didn't request this, you can safely ignore this email."
    )
    return send_email(to_address, subject, body)
