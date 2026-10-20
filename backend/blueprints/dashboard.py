from flask import Blueprint, jsonify
import db
import analytics
from extensions import login_required

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api")


# KPI numbers and cohort metrics for the Admin/Analyst dashboards.
@dashboard_bp.route("/dashboard/summary", methods=["GET"])
@login_required(roles=["admin", "teacher", "analyst"])
def dashboard_summary():
    return jsonify(db.student_dashboard_summary()), 200


@dashboard_bp.route("/analytics/correlations", methods=["GET"])
@login_required(roles=["admin", "analyst"])
def correlations():
    return jsonify({
        "correlations": db.student_feature_correlations(analytics.NUMERIC_COLS)
    }), 200


@dashboard_bp.route("/analytics/trend", methods=["GET"])
@login_required(roles=["admin", "analyst"])
def risk_trend():
    return jsonify({"trend": db.student_risk_trend()}), 200
