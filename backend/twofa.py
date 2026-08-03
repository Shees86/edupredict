"""
EduPredict - Two-Factor Authentication (TOTP)
================================================
Time-based One-Time Password 2FA — the same mechanism as Google
Authenticator / Authy. Completely free: no SMS, no third-party API,
just a shared secret and the standard TOTP algorithm (RFC 6238).

Requires: pip install pyotp
"""

import pyotp


def generate_secret():
    return pyotp.random_base32()


def get_provisioning_uri(secret, username, issuer="EduPredict"):
    """
    Returns an otpauth:// URI. The user can add this to Google
    Authenticator / Authy either by scanning a QR code generated from
    this URI (e.g. via a free online QR generator) or by typing the
    secret in manually — no QR-rendering library needed server-side.
    """
    return pyotp.TOTP(secret).provisioning_uri(name=username, issuer_name=issuer)


def verify_code(secret, code):
    if not secret or not code:
        return False
    totp = pyotp.TOTP(secret)
    return totp.verify(str(code).strip(), valid_window=1)
