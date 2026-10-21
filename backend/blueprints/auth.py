import hmac
import os
from flask import Blueprint, request, jsonify, session
import db
import emailer
import twofa
from extensions import login_required, rate_limit
from config import FRONTEND_ORIGIN

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/register", methods=["POST"])
@rate_limit(max_attempts=8, window_seconds=60)
def register():
    data = request.get_json(force=True)
    username = data.get("username")
    password = data.get("password")
    role = data.get("role")
    full_name = data.get("full_name", "")
    email = data.get("email", "").strip()

    # Admin accounts can only be created via register_admin() below,
    # never through this public endpoint.
    if role not in ("teacher", "student", "analyst"):
        return jsonify({"error": "Invalid role"}), 400
    if not username or not password:
        return jsonify({"error": "username and password required"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    if role == "student":
        # Ownership is: (1) Student ID is on the roster, (2) signup email
        # matches the email on that roster row when one is stored,
        # (3) an admin still has to approve the account before login.
        # Same error text in every failure so sequential IDs cannot be
        # probed, and "first person to type STU1000" cannot log in.
        student_denied = (
            "We couldn't create this student account. Confirm your Student ID "
            "and the email on file with your institution, or ask an administrator."
        )
        if not email:
            return jsonify({"error": student_denied}), 400
        student_record = db.students_col.find_one({"student_id": username}, {"_id": 0})
        if not student_record:
            return jsonify({"error": student_denied}), 400
        if db.users_col.find_one({"username": username}):
            return jsonify({"error": student_denied}), 400
        on_file = db.roster_email(student_record)
        if on_file and on_file != email.lower():
            return jsonify({"error": student_denied}), 400

    user_id, err = db.create_user(username, password, role, full_name, email)
    if err:
        return jsonify({"error": err}), 409

    db.log_action(username, role, "register", target=username,
                  details="Pending admin approval" if role in db.ROLES_REQUIRING_APPROVAL else "Auto-approved")

    if role in db.ROLES_REQUIRING_APPROVAL:
        return jsonify({"message": "Account created — awaiting admin approval before you can log in.", "user_id": user_id}), 201
    return jsonify({"message": "User created", "user_id": user_id}), 201


@auth_bp.route("/register-admin", methods=["POST"])
@rate_limit(max_attempts=5, window_seconds=60)
def register_admin():
    # Gated behind ADMIN_SETUP_KEY so only whoever holds that value
    # can create an admin account.
    setup_key = os.environ.get("ADMIN_SETUP_KEY")
    if not setup_key:
        return jsonify({"error": "Admin registration is disabled (no ADMIN_SETUP_KEY configured on the server)."}), 403

    data = request.get_json(force=True)
    supplied_setup_key = data.get("setup_key")
    if (
        not isinstance(supplied_setup_key, str)
        or not hmac.compare_digest(
            supplied_setup_key.encode("utf-8"),
            setup_key.encode("utf-8"),
        )
    ):
        return jsonify({"error": "Incorrect setup key."}), 403

    username = data.get("username")
    password = data.get("password")
    full_name = data.get("full_name", "")
    email = data.get("email", "").strip()
    if not username or not password:
        return jsonify({"error": "username and password required"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    user_id, err = db.create_user(username, password, "admin", full_name, email)
    if err:
        return jsonify({"error": err}), 409
    db.log_action(username, "admin", "register-admin", target=username, details="Created via gated admin setup key")
    return jsonify({"message": "Admin user created", "user_id": user_id}), 201


@auth_bp.route("/login", methods=["POST"])
@rate_limit(max_attempts=10, window_seconds=60)
def login():
    data = request.get_json(force=True)
    username = data.get("username")
    password = data.get("password")
    user = db.verify_user(username, password)
    if not user:
        return jsonify({"error": "Invalid credentials"}), 401

    if user.get("pending_approval"):
        return jsonify({"error": "Your account is awaiting admin approval. Please check back soon."}), 403

    if user.get("totp_enabled"):
        # Hold the login until the 2FA code is verified.
        session["pending_2fa_username"] = username
        return jsonify({"needs_2fa": True}), 200

    session["user"] = user
    db.log_action(username, user["role"], "login")
    return jsonify({"message": "Login successful", "user": user}), 200


@auth_bp.route("/login/verify-2fa", methods=["POST"])
@rate_limit(max_attempts=10, window_seconds=60)
def verify_2fa_login():
    username = session.get("pending_2fa_username")
    if not username:
        return jsonify({"error": "No login in progress. Please sign in again."}), 400
    data = request.get_json(force=True)
    code = data.get("code", "")

    secret = db.get_totp_secret(username)
    if not twofa.verify_code(secret, code):
        return jsonify({"error": "Incorrect code. Please try again."}), 401

    user = db.users_col.find_one({"username": username})
    session_user = {
        "id": str(user["_id"]), "username": user["username"],
        "role": user["role"], "full_name": user.get("full_name", ""),
        "totp_enabled": True,
    }
    session["user"] = session_user
    session.pop("pending_2fa_username", None)
    db.log_action(username, user["role"], "login (2FA)")
    return jsonify({"message": "Login successful", "user": session_user}), 200


@auth_bp.route("/logout", methods=["POST"])
def logout():
    session.pop("user", None)
    return jsonify({"message": "Logged out"}), 200


@auth_bp.route("/me", methods=["GET"])
def me():
    user = session.get("user")
    if not user:
        return jsonify({"error": "Not authenticated"}), 401
    return jsonify({"user": user}), 200


_RESET_ACK = "If an account exists for that username, a reset link has been sent."


@auth_bp.route("/forgot-password", methods=["POST"])
@rate_limit(max_attempts=5, window_seconds=60)
def forgot_password():
    data = request.get_json(force=True)
    username = data.get("username", "")

    # Same response whether or not the user exists, and never include
    # the token in the JSON — it stays in Mongo and is emailed when SMTP
    # is configured. Returning the token in the browser was an account-
    # takeover path whenever email was unset (typical on free hosting).
    if db.users_col.find_one({"username": username}):
        token = db.create_reset_token(username)
        if token:
            email, _ = db.get_user_email_and_prefs(username)
            sent = bool(email) and emailer.send_password_reset_email(email, token, FRONTEND_ORIGIN)
            if not sent:
                print(
                    "[auth] Password reset token stored server-side only "
                    "(no email on file, SMTP not configured, or send failed)."
                )

    return jsonify({"message": _RESET_ACK}), 200


@auth_bp.route("/reset-password", methods=["POST"])
@rate_limit(max_attempts=8, window_seconds=60)
def reset_password():
    data = request.get_json(force=True)
    token = data.get("token", "")
    new_password = data.get("new_password", "")
    if len(new_password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400
    ok = db.reset_password_with_token(token, new_password)
    if not ok:
        return jsonify({"error": "This reset link is invalid or has expired."}), 400
    return jsonify({"message": "Password updated — you can now sign in."}), 200


@auth_bp.route("/2fa/setup", methods=["POST"])
@login_required()
def setup_2fa():
    username = session["user"]["username"]
    user = db.users_col.find_one(
        {"username": username}, {"totp_secret": 1, "totp_enabled": 1}
    )
    if not user:
        return jsonify({"error": "Account not found."}), 404
    if user.get("totp_enabled") or user.get("totp_secret"):
        return jsonify({"error": "Two-factor authentication is already configured."}), 409

    secret = twofa.generate_secret()
    if not db.set_totp_secret(username, secret):
        return jsonify({"error": "Two-factor authentication is already configured."}), 409

    uri = twofa.get_provisioning_uri(secret, username)
    return jsonify({"secret": secret, "provisioning_uri": uri}), 200


@auth_bp.route("/2fa/confirm", methods=["POST"])
@login_required()
def confirm_2fa():
    username = session["user"]["username"]
    data = request.get_json(force=True)
    secret = db.get_totp_secret(username)
    if not twofa.verify_code(secret, data.get("code", "")):
        return jsonify({"error": "Incorrect code — check your authenticator app and try again."}), 400
    db.confirm_totp(username)
    session["user"]["totp_enabled"] = True
    db.log_action(username, session["user"]["role"], "enable-2fa")
    return jsonify({"message": "Two-factor authentication enabled."}), 200


@auth_bp.route("/2fa/disable", methods=["POST"])
@login_required()
def disable_2fa_route():
    username = session["user"]["username"]
    data = request.get_json(force=True)
    password = data.get("password", "")
    code = data.get("code", "")
    authenticated = bool(password) and bool(db.verify_user(username, password))
    if not authenticated and code:
        secret = db.get_totp_secret(username)
        authenticated = twofa.verify_code(secret, code)
    if not authenticated:
        return jsonify({"error": "Invalid password or two-factor authentication code."}), 401

    db.disable_totp(username)
    session["user"]["totp_enabled"] = False
    db.log_action(username, session["user"]["role"], "disable-2fa")
    return jsonify({"message": "Two-factor authentication disabled."}), 200
