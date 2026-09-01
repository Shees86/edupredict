from flask import Blueprint, jsonify
import db
import analytics
from extensions import login_required

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api")


# KPI numbers and cohort metrics for the Admin/Analyst dashboards.
@dashboard_bp.route("/dashboard/summary", methods=["GET"])
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


@dashboard_bp.route("/analytics/correlations", methods=["GET"])
@login_required(roles=["admin", "analyst"])
def correlations():
    students = db.list_students(limit=5000)
    return jsonify({"correlations": analytics.compute_correlations(students)}), 200


@dashboard_bp.route("/analytics/trend", methods=["GET"])
@login_required(roles=["admin", "analyst"])
def risk_trend():
    students = db.list_students(limit=5000)
    return jsonify({"trend": analytics.compute_risk_trend(students)}), 200
