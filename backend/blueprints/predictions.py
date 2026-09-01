import os
import json
from flask import Blueprint, request, jsonify
import db
import ml_predictor
import field_predictor
import university_predictor
import cgpa_predictor
import emailer
from extensions import login_required

predictions_bp = Blueprint("predictions", __name__, url_prefix="/api")
_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__ + "/.."))


# Runs the dropout-risk model and logs a high-risk alert if flagged.
@predictions_bp.route("/predict", methods=["POST"])
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


@predictions_bp.route("/model/metrics", methods=["GET"])
@login_required(roles=["admin", "analyst"])
def model_metrics():
    metrics_path = os.path.join(_BACKEND_DIR, "model_metrics.json")
    try:
        with open(metrics_path) as f:
            return jsonify(json.load(f)), 200
    except FileNotFoundError:
        return jsonify({"error": "Metrics not found. Run ml/train_model.py first."}), 404


@predictions_bp.route("/predict/field", methods=["POST"])
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


@predictions_bp.route("/model/field-metrics", methods=["GET"])
@login_required(roles=["admin", "analyst"])
def field_model_metrics():
    metrics_path = os.path.join(_BACKEND_DIR, "field_model_metrics.json")
    try:
        with open(metrics_path) as f:
            return jsonify(json.load(f)), 200
    except FileNotFoundError:
        return jsonify({"error": "Metrics not found. Run ml/train_field_model.py first."}), 404


@predictions_bp.route("/predict/university", methods=["POST"])
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


@predictions_bp.route("/model/university-metrics", methods=["GET"])
@login_required(roles=["admin", "analyst"])
def university_model_metrics():
    metrics_path = os.path.join(_BACKEND_DIR, "university_model_metrics.json")
    try:
        with open(metrics_path) as f:
            return jsonify(json.load(f)), 200
    except FileNotFoundError:
        return jsonify({"error": "Metrics not found. Run ml/train_university_model.py first."}), 404


@predictions_bp.route("/predict/cgpa", methods=["POST"])
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
