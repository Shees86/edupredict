import time
from flask import Blueprint, jsonify, request, session
import db
from extensions import login_required, stats

admin_bp = Blueprint("admin", __name__, url_prefix="/api")


# Teacher/Analyst signups require admin approval before they can log in.
@admin_bp.route("/admin/pending-users", methods=["GET"])
@login_required(roles=["admin"])
def list_pending_users():
    return jsonify({"pending": db.list_pending_users()}), 200


@admin_bp.route("/admin/approve/<username>", methods=["POST"])
@login_required(roles=["admin"])
def approve_pending_user(username):
    pending_user = db.users_col.find_one(
        {"username": username},
        {"_id": 0, "role": 1, "status": 1},
    )
    if not pending_user or pending_user.get("status") not in ("pending", "approved"):
        return jsonify({"error": "Pending account not found"}), 404

    role = pending_user.get("role")
    if role not in ("teacher", "analyst", "student"):
        return jsonify({"error": "This account cannot be approved here"}), 400
    if pending_user["status"] == "approved" and role not in ("teacher", "analyst"):
        return jsonify({"error": "This account does not need a staff assignment"}), 400

    data = request.get_json(silent=True) or {}
    if not isinstance(data, dict):
        return jsonify({"error": "Expected a JSON object"}), 400
    required_fields = {
        "teacher": {"school_id", "class_id"},
        "analyst": {"school_id"},
    }.get(role, set())
    if set(data) != required_fields:
        if required_fields:
            return jsonify({"error": "Assign this account to its school and class before approval"}), 400
        if data:
            return jsonify({"error": "This account does not accept a school or class assignment"}), 400

    assignment = {}
    for field in required_fields:
        value = data.get(field)
        if not isinstance(value, str) or not value.strip() or len(value.strip()) > 128:
            return jsonify({"error": f"{field} must be a non-empty string of at most 128 characters"}), 400
        assignment[field] = value.strip()

    db.approve_user(username, **assignment)
    action = "assign-staff-scope" if pending_user["status"] == "approved" else "approve-user"
    db.log_action(session["user"]["username"], "admin", action, target=username)
    return jsonify({"message": f"{username} approved."}), 200


@admin_bp.route("/admin/reject/<username>", methods=["POST"])
@login_required(roles=["admin"])
def reject_pending_user(username):
    db.reject_user(username)
    db.log_action(session["user"]["username"], "admin", "reject-user", target=username)
    return jsonify({"message": f"{username} rejected."}), 200


# Audit log — admin-only visibility into who did what and when.
@admin_bp.route("/audit-log", methods=["GET"])
@login_required(roles=["admin"])
def get_audit_log():
    try:
        page = int(request.args.get("page", "1"))
        per_page = int(request.args.get("per_page", "10"))
    except ValueError:
        return jsonify({"error": "page and per_page must be integers"}), 400
    if page < 1 or not 1 <= per_page <= 100:
        return jsonify({"error": "page must be positive and per_page must be between 1 and 100"}), 400

    count = db.count_audit_log()
    return jsonify({
        "log": db.list_audit_log(limit=per_page, offset=(page - 1) * per_page),
        "count": count,
        "page": page,
        "per_page": per_page,
    }), 200


# Numbers tracked in extensions.stats, updated by the request hooks in app.py.
@admin_bp.route("/system/stats", methods=["GET"])
@login_required(roles=["admin"])
def system_stats():
    uptime_seconds = time.time() - stats["start_time"]
    avg_response_ms = (
        (stats["total_duration"] / stats["request_count"]) * 1000
        if stats["request_count"] else 0
    )
    return jsonify({
        "uptime_seconds": round(uptime_seconds, 1),
        "request_count": stats["request_count"],
        "avg_response_ms": round(avg_response_ms, 2),
        "error_count": stats["errors"],
        "student_count": db.students_col.count_documents({}),
        "user_count": db.users_col.count_documents({}),
        "unresolved_alerts": db.alerts_col.count_documents({"resolved": False}),
    }), 200
