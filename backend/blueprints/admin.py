import time
from flask import Blueprint, jsonify, session
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
    db.approve_user(username)
    db.log_action(session["user"]["username"], "admin", "approve-user", target=username)
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
    return jsonify({"log": db.list_audit_log()}), 200


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
