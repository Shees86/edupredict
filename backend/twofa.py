"""TOTP-based two-factor authentication (RFC 6238) — compatible with
Google Authenticator, Authy, and similar apps."""

import pyotp


def generate_secret():
    return pyotp.random_base32()


def get_provisioning_uri(secret, username, issuer="EduPredict"):
    """otpauth:// URI for the given secret. Can be rendered as a QR
    code client-side, or entered manually into an authenticator app."""
    return pyotp.TOTP(secret).provisioning_uri(name=username, issuer_name=issuer)


def verify_code(secret, code):
    if not secret or not code:
        return False
    totp = pyotp.TOTP(secret)
    return totp.verify(str(code).strip(), valid_window=1)
