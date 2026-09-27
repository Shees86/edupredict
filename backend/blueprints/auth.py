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
        student_record = db.students_col.find_one({"student_id": username}, {"_id": 0})
        if not student_record:
            return jsonify({"error": "Student ID not found in institutional records. Please verify with your faculty."}), 400
        existing_user = db.users_col.find_one({"username": username})
        if existing_user:
            return jsonify({"error": "An account has already been registered/claimed for this Student ID."}), 400

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
    if data.get("setup_key") != setup_key:
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


@auth_bp.route("/forgot-password", methods=["POST"])
@rate_limit(max_attempts=5, window_seconds=60)
def forgot_password():
    data = request.get_json(force=True)
    username = data.get("username", "")

    # NOTE: this intentionally reveals whether an account exists,
    # per product decision — trades away protection against account
    # enumeration for clearer UX. See docs/SECURITY.md.
    if not db.users_col.find_one({"username": username}):
        return jsonify({"error": f'No account found for "{username}".'}), 404

    token = db.create_reset_token(username)
    if not token:
        return jsonify({"error": f'No account found for "{username}".'}), 404

    email, _ = db.get_user_email_and_prefs(username)
    sent = False
    if email:
        sent = emailer.send_password_reset_email(email, token, FRONTEND_ORIGIN)

    response = {"message": "Reset link generated."}
    if not sent:
        # No SMTP configured — return the token directly for local testing.
        response["dev_reset_token"] = token
    return jsonify(response), 200


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
    secret = twofa.generate_secret()
    db.set_totp_secret(username, secret)
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
    db.disable_totp(username)
    session["user"]["totp_enabled"] = False
    db.log_action(username, session["user"]["role"], "disable-2fa")
    return jsonify({"message": "Two-factor authentication disabled."}), 200
