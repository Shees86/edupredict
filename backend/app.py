import os
import io
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
)
FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173")
CORS(app, supports_credentials=True, origins=[FRONTEND_ORIGIN])


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


@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json(force=True)
    username = data.get("username")
    password = data.get("password")
    role = data.get("role")
    full_name = data.get("full_name", "")

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

        result = db.users_col.insert_one({
            "username": username,
            "password_hash": db.generate_password_hash(password),
            "role": role,
            "full_name": full_name,
            "created_at": db.datetime.utcnow(),
        })
        return jsonify({"message": "User created", "user_id": str(result.inserted_id)}), 201

    user_id, err = db.create_user(username, password, role, full_name)
    if err:
        return jsonify({"error": err}), 409
    return jsonify({"message": "User created", "user_id": user_id}), 201


@app.route("/api/auth/register-admin", methods=["POST"])
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
    if not username or not password:
        return jsonify({"error": "username and password required"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    user_id, err = db.create_user(username, password, "admin", full_name)
    if err:
        return jsonify({"error": err}), 409
    return jsonify({"message": "Admin user created", "user_id": user_id}), 201


@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json(force=True)
    username = data.get("username")
    password = data.get("password")
    user = db.verify_user(username, password)
    if not user:
        return jsonify({"error": "Invalid credentials"}), 401
    session["user"] = user
    return jsonify({"message": "Login successful", "user": user}), 200


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


@app.route("/api/students", methods=["GET"])
@login_required(roles=["admin", "teacher", "analyst"])
def get_students():
    search_query = (request.args.get("search") or request.args.get("query") or "").strip()
    if search_query:
        filter_query = {
            "$or": [
                {"student_id": {"$regex": search_query, "$options": "i"}},
                {"full_name": {"$regex": search_query, "$options": "i"}},
            ]
        }
        students = db.list_students(filter_query=filter_query, limit=None)
    else:
        students = db.list_students(limit=10)
    return jsonify({"students": students, "count": len(students)}), 200


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
                errors.append({"row": i, "error": str(e)})
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


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200
if __name__ == "__main__":
    db.init_indexes()
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=os.environ.get("FLASK_DEBUG", "false").lower() == "true")
