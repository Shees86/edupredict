import os
import io
import re
import csv
import json
import time
from functools import wraps
from flask import Flask, request, jsonify, session, Response
from flask_cors import CORS
import db
import ml_predictor
import analytics
import field_predictor
import university_predictor
import cgpa_predictor
import emailer
import twofa
import badges

app = Flask(__name__)

# ---------------------------------------------------------------
# Lightweight performance monitoring — tracks uptime, request
# volume, and response times in-process. Doesn't replace a full
# APM tool, but gives a genuine "Performance Monitoring" surface
# on top of what Render/Vercel/Atlas already expose at the
# infrastructure level.
# ---------------------------------------------------------------
_stats = {"start_time": time.time(), "request_count": 0, "total_duration": 0.0, "errors": 0}


@app.before_request
def _track_request_start():
    request._start_time = time.time()


@app.after_request
def _track_request_end(response):
    duration = time.time() - getattr(request, "_start_time", time.time())
    _stats["request_count"] += 1
    _stats["total_duration"] += duration
    if response.status_code >= 500:
        _stats["errors"] += 1
    return response

app.secret_key = os.environ.get("FLASK_SECRET_KEY", "dev-secret-change-me")
app.config.update(
    SESSION_COOKIE_SAMESITE="None",
    SESSION_COOKIE_SECURE=True,
    SESSION_COOKIE_HTTPONLY=True,          # JS on the page can't read the session cookie (XSS mitigation)
    MAX_CONTENT_LENGTH=5 * 1024 * 1024,    # 5 MB cap on any request body — blocks oversized upload abuse
)
FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173")
CORS(app, supports_credentials=True, origins=[FRONTEND_ORIGIN])  # never wildcard "*" — only our own frontend


@app.after_request
def _apply_security_headers(response):
    # Baseline security headers (safe defaults that won't break the app,
    # unlike a strict CSP which would need per-asset allowlisting).
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


def login_required(roles=None):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            user = session.get("user")
            if not user:
                return jsonify({"error": "Not authenticated"}), 401
            if roles and user["role"] not in roles:
                return jsonify({"error": "Forbidden: insufficient role"}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator


# ---------------------------------------------------------------
# Basic in-memory rate limiter — protects login/register from
# brute-force and spam abuse without needing an external service.
# Not distributed (resets if the server restarts, and won't share
# state across multiple instances), but a real, working first line
# of defense for a single-instance deployment like this one.
# ---------------------------------------------------------------
_rate_limit_hits = {}


def rate_limit(max_attempts=8, window_seconds=60):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            client_ip = request.headers.get("X-Forwarded-For", request.remote_addr or "unknown").split(",")[0].strip()
            key = f"{fn.__name__}:{client_ip}"
            now = time.time()
            attempts = [t for t in _rate_limit_hits.get(key, []) if now - t < window_seconds]
            if len(attempts) >= max_attempts:
                return jsonify({"error": "Too many attempts — please wait a minute and try again."}), 429
            attempts.append(now)
            _rate_limit_hits[key] = attempts
            return fn(*args, **kwargs)
        return wrapper
    return decorator


# ---------------------------------------------------------------
# Auth routes — register (Teacher/Student/Analyst self-signup),
# gated admin creation, login, logout, session check, and
# self-service account deletion.
# ---------------------------------------------------------------
@app.route("/api/auth/register", methods=["POST"])
@rate_limit(max_attempts=8, window_seconds=60)
def register():
    data = request.get_json(force=True)
    username = data.get("username")
    password = data.get("password")
    role = data.get("role")
    full_name = data.get("full_name", "")
    email = data.get("email", "").strip()

    # SECURITY: public self-registration must never be able to grant
    # admin privileges — that would let any visitor make themselves
    # an administrator. Admin accounts go through a separate, gated
    # path (see /api/auth/register-admin below).
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


@app.route("/api/auth/register-admin", methods=["POST"])
@rate_limit(max_attempts=5, window_seconds=60)
def register_admin():
    """
    Creates an admin account, but only if the caller provides the
    correct ADMIN_SETUP_KEY (set as an environment variable on the
    server, never shipped in frontend code). This is the ONLY way to
    create an admin account — public /api/auth/register can't grant
    admin privileges. Share the setup key only with people who should
    be able to create admin accounts (e.g. yourself, during setup).
    """
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


@app.route("/api/auth/login", methods=["POST"])
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
        # 2FA is on for this account — don't fully log in yet. Stash
        # who's mid-login in a short-lived session marker and ask the
        # frontend to prompt for the 6-digit code next.
        session["pending_2fa_username"] = username
        return jsonify({"needs_2fa": True}), 200

    session["user"] = user
    db.log_action(username, user["role"], "login")
    return jsonify({"message": "Login successful", "user": user}), 200


@app.route("/api/auth/login/verify-2fa", methods=["POST"])
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


@app.route("/api/auth/logout", methods=["POST"])
def logout():
    session.pop("user", None)
    return jsonify({"message": "Logged out"}), 200


@app.route("/api/auth/me", methods=["GET"])
def me():
    user = session.get("user")
    if not user:
        return jsonify({"error": "Not authenticated"}), 401
    return jsonify({"user": user}), 200


# ---------------------------------------------------------------
# Password reset — request a reset link (emailed if SMTP is
# configured; otherwise the token comes back in the response so the
# flow is still testable in local/dev without an email provider).
# ---------------------------------------------------------------
@app.route("/api/auth/forgot-password", methods=["POST"])
@rate_limit(max_attempts=5, window_seconds=60)
def forgot_password():
    data = request.get_json(force=True)
    username = data.get("username", "")
    token = db.create_reset_token(username)
    # Always return success even if the username doesn't exist —
    # otherwise this endpoint could be used to enumerate usernames.
    if not token:
        return jsonify({"message": "If that account exists, a reset link has been generated."}), 200

    email, _ = db.get_user_email_and_prefs(username)
    sent = False
    if email:
        sent = emailer.send_password_reset_email(email, token, FRONTEND_ORIGIN)

    response = {"message": "If that account exists, a reset link has been generated."}
    if not sent:
        # No email configured/on file — hand back the token directly
        # so this still works for local testing and demos.
        response["dev_reset_token"] = token
    return jsonify(response), 200


@app.route("/api/auth/reset-password", methods=["POST"])
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


# ---------------------------------------------------------------
# Two-factor authentication setup (must be logged in already).
# ---------------------------------------------------------------
@app.route("/api/auth/2fa/setup", methods=["POST"])
@login_required()
def setup_2fa():
    username = session["user"]["username"]
    secret = twofa.generate_secret()
    db.set_totp_secret(username, secret)
    uri = twofa.get_provisioning_uri(secret, username)
    return jsonify({"secret": secret, "provisioning_uri": uri}), 200


@app.route("/api/auth/2fa/confirm", methods=["POST"])
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


@app.route("/api/auth/2fa/disable", methods=["POST"])
@login_required()
def disable_2fa_route():
    username = session["user"]["username"]
    db.disable_totp(username)
    session["user"]["totp_enabled"] = False
    db.log_action(username, session["user"]["role"], "disable-2fa")
    return jsonify({"message": "Two-factor authentication disabled."}), 200


# ---------------------------------------------------------------
# Admin role-approval workflow — Teacher/Analyst signups require
# an admin to approve before they can log in.
# ---------------------------------------------------------------
@app.route("/api/admin/pending-users", methods=["GET"])
@login_required(roles=["admin"])
def list_pending_users():
    return jsonify({"pending": db.list_pending_users()}), 200


@app.route("/api/admin/approve/<username>", methods=["POST"])
@login_required(roles=["admin"])
def approve_pending_user(username):
    db.approve_user(username)
    db.log_action(session["user"]["username"], "admin", "approve-user", target=username)
    return jsonify({"message": f"{username} approved."}), 200


@app.route("/api/admin/reject/<username>", methods=["POST"])
@login_required(roles=["admin"])
def reject_pending_user(username):
    db.reject_user(username)
    db.log_action(session["user"]["username"], "admin", "reject-user", target=username)
    return jsonify({"message": f"{username} rejected."}), 200


# ---------------------------------------------------------------
# Audit log — admin-only visibility into who did what and when.
# ---------------------------------------------------------------
@app.route("/api/audit-log", methods=["GET"])
@login_required(roles=["admin"])
def get_audit_log():
    return jsonify({"log": db.list_audit_log()}), 200


# ---------------------------------------------------------------
# Student records (institutional roster) — list/search, view one,
# and manual create/update. Populated via CSV/JSON ingestion or a
# student claiming their own pre-loaded record at registration.
# ---------------------------------------------------------------
@app.route("/api/students", methods=["GET"])
@login_required(roles=["admin", "teacher", "analyst"])
def get_students():
    search_query = (request.args.get("search") or request.args.get("query") or "").strip()
    conditions = []

    if search_query:
        # SECURITY: escape the user's input before using it as a Mongo
        # $regex — otherwise a crafted string (e.g. nested quantifiers)
        # could act as a NoSQL-injection / ReDoS vector against the DB.
        safe_pattern = re.escape(search_query[:100])  # also cap length
        conditions.append({"$or": [
            {"student_id": {"$regex": safe_pattern, "$options": "i"}},
            {"full_name": {"$regex": safe_pattern, "$options": "i"}},
        ]})

    # Advanced filters — attendance/GPA range and risk level, all optional.
    def _num(name):
        val = request.args.get(name)
        try:
            return float(val) if val not in (None, "") else None
        except ValueError:
            return None

    attendance_min, attendance_max = _num("attendance_min"), _num("attendance_max")
    gpa_min, gpa_max = _num("gpa_min"), _num("gpa_max")
    risk = request.args.get("risk")  # "high" | "safe"

    if attendance_min is not None or attendance_max is not None:
        rng = {}
        if attendance_min is not None:
            rng["$gte"] = attendance_min
        if attendance_max is not None:
            rng["$lte"] = attendance_max
        conditions.append({"attendance_rate": rng})

    if gpa_min is not None or gpa_max is not None:
        rng = {}
        if gpa_min is not None:
            rng["$gte"] = gpa_min
        if gpa_max is not None:
            rng["$lte"] = gpa_max
        conditions.append({"previous_semester_gpa": rng})

    if risk in ("high", "safe"):
        conditions.append({"dropout_risk": 1 if risk == "high" else 0})

    if conditions:
        filter_query = {"$and": conditions} if len(conditions) > 1 else conditions[0]
        students = db.list_students(filter_query=filter_query, limit=None)
    else:
        students = db.list_students(limit=10)
    return jsonify({"students": students, "count": len(students)}), 200


@app.route("/api/cohort/compare", methods=["GET"])
@login_required(roles=["admin", "analyst"])
def compare_cohorts():
    """
    Compares two groups of students (e.g. two sections, or two
    semesters) by any combination of risk-level filter. Pass each
    group's filter as ?group_a_risk=high&group_b_risk=safe, etc.
    Returns aggregate stats (avg attendance/score/GPA, high-risk %)
    for each group side by side.
    """
    def build_filter(prefix):
        conditions = []
        risk = request.args.get(f"{prefix}_risk")
        if risk in ("high", "safe"):
            conditions.append({"dropout_risk": 1 if risk == "high" else 0})
        gender = request.args.get(f"{prefix}_gender")
        if gender:
            conditions.append({"gender": gender})
        return {"$and": conditions} if conditions else {}

    def summarize(filter_query):
        rows = db.list_students(filter_query=filter_query, limit=None)
        n = len(rows)
        if n == 0:
            return {"count": 0}
        avg = lambda key: round(sum((r.get(key) or 0) for r in rows) / n, 2)
        high_risk = sum(1 for r in rows if r.get("dropout_risk") == 1)
        return {
            "count": n,
            "avg_attendance": avg("attendance_rate"),
            "avg_score": avg("avg_test_score"),
            "avg_gpa": avg("previous_semester_gpa"),
            "high_risk_pct": round(100 * high_risk / n, 1),
        }

    return jsonify({
        "group_a": summarize(build_filter("group_a")),
        "group_b": summarize(build_filter("group_b")),
    }), 200


@app.route("/api/students/<student_id>", methods=["GET"])
@login_required(roles=["admin", "teacher", "analyst", "student"])
def get_student(student_id):
    user = session["user"]
    if user["role"] == "student" and user["username"] != student_id:
        return jsonify({"error": "Students may only view their own record"}), 403
    student = db.get_student(student_id)
    if not student:
        return jsonify({"error": "Not found"}), 404
    return jsonify(student), 200


@app.route("/api/students", methods=["POST"])
@login_required(roles=["admin", "teacher"])
def upsert_student():
    data = request.get_json(force=True)
    if "student_id" not in data:
        return jsonify({"error": "student_id required"}), 400
    db.upsert_student(data)
    return jsonify({"message": "Saved"}), 200


@app.route("/api/data/ingest", methods=["POST"])
@login_required(roles=["admin", "teacher"])
def ingest_csv():
    """
    Batch data ingestion — supports both CSV and JSON, the two most
    common interchange formats for educational/LMS data exports.
    - CSV: multipart form upload, field name 'file'.
    - JSON: either a raw array of student objects in the request
      body, or a multipart file upload of a .json file.
    """
    NUMERIC_FIELDS = [
        "age", "attendance_rate", "avg_test_score",
        "assignments_submitted_pct", "study_hours_per_week",
        "previous_semester_gpa", "lms_login_frequency_per_week",
        "dropout_risk",
    ]

    def ingest_rows(rows):
        inserted, skipped, errors = 0, 0, []
        for i, row in enumerate(rows):
            if not row.get("student_id"):
                skipped += 1
                continue
            try:
                for numeric_field in NUMERIC_FIELDS:
                    if row.get(numeric_field) not in (None, ""):
                        row[numeric_field] = float(row[numeric_field])
                db.upsert_student(row)
                inserted += 1
            except Exception as e:
                errors.append({"row": i, "error": "Invalid or missing value in one of the numeric columns"})
        return inserted, skipped, errors

    # JSON body (no file) — e.g. { "students": [ {...}, {...} ] }
    if request.is_json:
        payload = request.get_json(force=True)
        rows = payload.get("students", payload if isinstance(payload, list) else [])
        if not rows:
            return jsonify({"error": "Expected a JSON array or {\"students\": [...]}"}), 400
        inserted, skipped, errors = ingest_rows(rows)
        return jsonify({"message": "Ingestion complete", "format": "json", "inserted": inserted, "skipped": skipped, "errors": errors[:10]}), 200

    if "file" not in request.files:
        return jsonify({"error": "No file uploaded (expected form field 'file', or a JSON body)"}), 400

    file = request.files["file"]
    filename = (file.filename or "").lower()

    if filename.endswith(".json"):
        try:
            payload = json.loads(file.stream.read().decode("utf-8"))
        except Exception:
            return jsonify({"error": "Invalid JSON file"}), 400
        rows = payload.get("students", payload if isinstance(payload, list) else [])
        inserted, skipped, errors = ingest_rows(rows)
        return jsonify({"message": "Ingestion complete", "format": "json", "inserted": inserted, "skipped": skipped, "errors": errors[:10]}), 200

    if filename.endswith(".csv"):
        stream = io.StringIO(file.stream.read().decode("utf-8"))
        reader = csv.DictReader(stream)
        inserted, skipped, errors = ingest_rows(list(reader))
        return jsonify({"message": "Ingestion complete", "format": "csv", "inserted": inserted, "skipped": skipped, "errors": errors[:10]}), 200

    return jsonify({"error": "Only .csv or .json files are supported"}), 400


# ---------------------------------------------------------------
# Dropout-risk prediction — runs the trained Random Forest model
# against one student's current metrics and logs a high-risk alert
# automatically when the result crosses the threshold.
# ---------------------------------------------------------------
@app.route("/api/predict", methods=["POST"])
@login_required(roles=["admin", "teacher", "analyst"])
def predict():
    data = request.get_json(force=True)
    required = [
        "student_id", "age", "attendance_rate", "avg_test_score",
        "assignments_submitted_pct", "study_hours_per_week",
        "previous_semester_gpa", "lms_login_frequency_per_week",
        "gender", "family_income_level", "parental_education", "extracurricular"
    ]
    missing = [f for f in required if f not in data]
    if missing:
        return jsonify({"error": f"Missing fields: {missing}"}), 400
    label, probability = ml_predictor.predict_dropout_risk(data)
    db.save_prediction(data["student_id"], label, probability, data)
    if label == "High Risk":
        db.create_alert(
            data["student_id"],
            f"Student {data['student_id']} flagged as HIGH DROPOUT RISK "
            f"(probability {probability:.0%})",
            severity="high",
        )
        # Email notification (only sent if SMTP is configured and the
        # recipient has opted in — see emailer.py / notification prefs).
        for recipient_email in db.list_alert_recipient_emails():
            emailer.send_high_risk_alert_email(recipient_email, data["student_id"], probability)
    return jsonify({
        "student_id": data["student_id"],
        "risk_label": label,
        "risk_probability": probability,
    }), 200


@app.route("/api/alerts", methods=["GET"])
@login_required(roles=["admin", "teacher", "analyst"])
def get_alerts():
    alerts = db.list_alerts(resolved=False)
    return jsonify({"alerts": alerts, "count": len(alerts)}), 200


@app.route("/api/alerts/stream")
@login_required(roles=["admin", "teacher", "analyst"])
def alerts_stream():
    def event_stream():
        existing = db.list_alerts(resolved=False, limit=200)
        last_seen_ids = set(f"{a['student_id']}-{a['created_at']}" for a in existing)
        while True:
            alerts = db.list_alerts(resolved=False, limit=20)
            for a in alerts:
                key = f"{a['student_id']}-{a['created_at']}"
                if key not in last_seen_ids:
                    last_seen_ids.add(key)
                    yield f"data: {json.dumps(a, default=str)}\n\n"
            time.sleep(3)
    return Response(event_stream(), mimetype="text/event-stream")


# ---------------------------------------------------------------
# Dashboard summary and model/cohort analytics — KPI numbers and
# metrics consumed by the Admin and Analyst views.
# ---------------------------------------------------------------
@app.route("/api/dashboard/summary", methods=["GET"])
@login_required(roles=["admin", "teacher", "analyst"])
def dashboard_summary():
    students = db.list_students(limit=5000)
    total = len(students)
    high_risk = sum(1 for s in students if s.get("dropout_risk") == 1)
    avg_attendance = (
        round(sum(s.get("attendance_rate", 0) for s in students) / total, 2)
        if total else 0
    )
    avg_score = (
        round(sum(s.get("avg_test_score", 0) for s in students) / total, 2)
        if total else 0
    )
    return jsonify({
        "total_students": total,
        "high_risk_count": high_risk,
        "safe_count": total - high_risk,
        "avg_attendance": avg_attendance,
        "avg_score": avg_score,
    }), 200


@app.route("/api/model/metrics", methods=["GET"])
@login_required(roles=["admin", "analyst"])
def model_metrics():
    metrics_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "model_metrics.json")
    try:
        with open(metrics_path) as f:
            return jsonify(json.load(f)), 200
    except FileNotFoundError:
        return jsonify({"error": "Metrics not found. Run ml/train_model.py first."}), 404


@app.route("/api/analytics/correlations", methods=["GET"])
@login_required(roles=["admin", "analyst"])
def correlations():
    students = db.list_students(limit=5000)
    return jsonify({"correlations": analytics.compute_correlations(students)}), 200


@app.route("/api/analytics/trend", methods=["GET"])
@login_required(roles=["admin", "analyst"])
def risk_trend():
    students = db.list_students(limit=5000)
    return jsonify({"trend": analytics.compute_risk_trend(students)}), 200


@app.route("/api/feedback", methods=["POST"])
@login_required()
def submit_feedback():
    data = request.get_json(force=True)
    message = data.get("message", "").strip()
    category = data.get("category", "feedback")
    if not message:
        return jsonify({"error": "message is required"}), 400
    user = session["user"]
    feedback_id = db.create_feedback(user["username"], user["role"], category, message)
    return jsonify({"message": "Feedback submitted", "feedback_id": feedback_id}), 201


@app.route("/api/feedback", methods=["GET"])
@login_required(roles=["admin"])
def list_feedback():
    status = request.args.get("status")
    items = db.list_feedback(status=status)
    return jsonify({"feedback": items, "count": len(items)}), 200


@app.route("/api/feedback/<feedback_id>/resolve", methods=["POST"])
@login_required(roles=["admin"])
def resolve_feedback_route(feedback_id):
    db.resolve_feedback(feedback_id)
    return jsonify({"message": "Marked resolved"}), 200


@app.route("/api/predict/field", methods=["POST"])
@login_required()
def predict_field():
    data = request.get_json(force=True)
    matric_percentage = data.get("matric_percentage")
    if matric_percentage is None:
        return jsonify({"error": "matric_percentage is required"}), 400
    try:
        matric_percentage = float(matric_percentage)
        if not (0 <= matric_percentage <= 100):
            raise ValueError()
    except ValueError:
        return jsonify({"error": "matric_percentage must be a number between 0 and 100"}), 400
    result = field_predictor.predict_field_and_college(
        matric_percentage=matric_percentage,
        science_aptitude=float(data.get("science_aptitude", 0.5)),
        extracurricular_score=float(data.get("extracurricular_score", 50)),
        city_tier=data.get("city_tier", "Urban"),
    )
    return jsonify(result), 200


@app.route("/api/model/field-metrics", methods=["GET"])
@login_required(roles=["admin", "analyst"])
def field_model_metrics():
    metrics_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "field_model_metrics.json")
    try:
        with open(metrics_path) as f:
            return jsonify(json.load(f)), 200
    except FileNotFoundError:
        return jsonify({"error": "Metrics not found. Run ml/train_field_model.py first."}), 404


@app.route("/api/predict/university", methods=["POST"])
@login_required()
def predict_university():
    data = request.get_json(force=True)
    inter_pct = data.get("intermediate_percentage")
    if inter_pct is None:
        return jsonify({"error": "intermediate_percentage is required"}), 400
    try:
        inter_pct = float(inter_pct)
        if not (0 <= inter_pct <= 100):
            raise ValueError()
    except ValueError:
        return jsonify({"error": "intermediate_percentage must be a number between 0 and 100"}), 400
    result = university_predictor.predict_university(
        intermediate_percentage=inter_pct,
        entry_test_score=data.get("entry_test_score"),
        field=data.get("field", "Computer Science"),
        city_tier=data.get("city_tier", "Urban"),
    )
    return jsonify(result), 200


@app.route("/api/predict/cgpa", methods=["POST"])
@login_required()
def predict_cgpa():
    data = request.get_json(force=True)
    required = [
        "attendance_rate", "avg_test_score", "assignments_submitted_pct",
        "study_hours_per_week", "previous_semester_gpa", "lms_login_frequency_per_week",
    ]
    missing = [f for f in required if f not in data]
    if missing:
        return jsonify({"error": f"Missing fields: {missing}"}), 400
    result = cgpa_predictor.predict_next_gpa(
        attendance_rate=float(data["attendance_rate"]),
        avg_test_score=float(data["avg_test_score"]),
        assignments_submitted_pct=float(data["assignments_submitted_pct"]),
        study_hours_per_week=float(data["study_hours_per_week"]),
        previous_semester_gpa=float(data["previous_semester_gpa"]),
        lms_login_frequency_per_week=float(data["lms_login_frequency_per_week"]),
        extracurricular=data.get("extracurricular", "No"),
    )
    return jsonify(result), 200


@app.route("/api/system/stats", methods=["GET"])
@login_required(roles=["admin"])
def system_stats():
    uptime_seconds = time.time() - _stats["start_time"]
    avg_response_ms = (
        (_stats["total_duration"] / _stats["request_count"]) * 1000
        if _stats["request_count"] else 0
    )
    return jsonify({
        "uptime_seconds": round(uptime_seconds, 1),
        "request_count": _stats["request_count"],
        "avg_response_ms": round(avg_response_ms, 2),
        "error_count": _stats["errors"],
        "student_count": db.students_col.count_documents({}),
        "user_count": db.users_col.count_documents({}),
        "unresolved_alerts": db.alerts_col.count_documents({"resolved": False}),
    }), 200


# ---------------------------------------------------------------
# Student progress goals — a student sets their own target (e.g.
# "80% attendance this semester"); Admin/Teacher can view any
# student's goal alongside their current standing.
# ---------------------------------------------------------------
@app.route("/api/goals/<student_id>", methods=["GET"])
@login_required(roles=["admin", "teacher", "analyst", "student"])
def get_student_goal(student_id):
    user = session["user"]
    if user["role"] == "student" and user["username"] != student_id:
        return jsonify({"error": "Students may only view their own goal"}), 403
    goal = db.get_goal(student_id)
    return jsonify({"goal": goal}), 200


@app.route("/api/goals", methods=["POST"])
@login_required(roles=["student"])
def set_student_goal():
    user = session["user"]
    data = request.get_json(force=True)
    goal_type = data.get("goal_type")  # "attendance" | "gpa" | "test_score"
    target_value = data.get("target_value")
    if goal_type not in ("attendance", "gpa", "test_score") or target_value is None:
        return jsonify({"error": "goal_type must be attendance/gpa/test_score, target_value required"}), 400
    db.set_goal(user["username"], goal_type, float(target_value))
    return jsonify({"message": "Goal saved"}), 200


# ---------------------------------------------------------------
# Achievement badges — computed on the fly from the student's record.
# ---------------------------------------------------------------
@app.route("/api/badges/<student_id>", methods=["GET"])
@login_required(roles=["admin", "teacher", "analyst", "student"])
def get_student_badges(student_id):
    user = session["user"]
    if user["role"] == "student" and user["username"] != student_id:
        return jsonify({"error": "Students may only view their own badges"}), 403
    record = db.get_student(student_id)
    return jsonify({"badges": badges.compute_badges(record)}), 200


# ---------------------------------------------------------------
# In-app messaging — Teacher <-> Student, no external service.
# ---------------------------------------------------------------
@app.route("/api/messages/conversations", methods=["GET"])
@login_required(roles=["admin", "teacher", "student"])
def get_conversations():
    username = session["user"]["username"]
    return jsonify({"conversations": db.list_conversations_for(username)}), 200


@app.route("/api/messages/<other_user>", methods=["GET"])
@login_required(roles=["admin", "teacher", "student"])
def get_conversation(other_user):
    username = session["user"]["username"]
    return jsonify({"messages": db.list_conversation(username, other_user)}), 200


@app.route("/api/messages", methods=["POST"])
@login_required(roles=["admin", "teacher", "student"])
def post_message():
    user = session["user"]
    data = request.get_json(force=True)
    recipient = data.get("recipient")
    text = (data.get("text") or "").strip()
    if not recipient or not text:
        return jsonify({"error": "recipient and text are required"}), 400
    db.send_message(user["username"], recipient, user["role"], text[:2000])
    return jsonify({"message": "Sent"}), 201


# ---------------------------------------------------------------
# Notification preferences — which alert channels a user wants.
# ---------------------------------------------------------------
@app.route("/api/notifications/preferences", methods=["GET"])
@login_required()
def get_prefs():
    prefs = db.get_notification_prefs(session["user"]["username"])
    return jsonify({"preferences": prefs}), 200


@app.route("/api/notifications/preferences", methods=["PUT"])
@login_required()
def update_prefs():
    data = request.get_json(force=True)
    prefs = {
        "email_alerts": bool(data.get("email_alerts", True)),
        "in_app_alerts": bool(data.get("in_app_alerts", True)),
    }
    db.update_notification_prefs(session["user"]["username"], prefs)
    return jsonify({"message": "Preferences saved", "preferences": prefs}), 200


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200
if __name__ == "__main__":
    db.init_indexes()
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=os.environ.get("FLASK_DEBUG", "false").lower() == "true")
