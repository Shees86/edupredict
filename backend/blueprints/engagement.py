from flask import Blueprint, request, jsonify, session
import db
import badges
from extensions import login_required

engagement_bp = Blueprint("engagement", __name__, url_prefix="/api")


# Students set their own progress goals (attendance/GPA/score target).
@engagement_bp.route("/goals/<student_id>", methods=["GET"])
@login_required(roles=["admin", "teacher", "analyst", "student"])
def get_student_goal(student_id):
    user = session["user"]
    if user["role"] == "student" and user["username"] != student_id:
        return jsonify({"error": "Students may only view their own goal"}), 403
    goal = db.get_goal(student_id)
    return jsonify({"goal": goal}), 200


@engagement_bp.route("/goals", methods=["POST"])
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


# Badges are computed on the fly from the student's record.
@engagement_bp.route("/badges/<student_id>", methods=["GET"])
@login_required(roles=["admin", "teacher", "analyst", "student"])
def get_student_badges(student_id):
    user = session["user"]
    if user["role"] == "student" and user["username"] != student_id:
        return jsonify({"error": "Students may only view their own badges"}), 403
    record = db.get_student(student_id)
    return jsonify({"badges": badges.compute_badges(record)}), 200


# In-app messaging between roles.
@engagement_bp.route("/messages/conversations", methods=["GET"])
@login_required(roles=["admin", "teacher", "student"])
def get_conversations():
    username = session["user"]["username"]
    return jsonify({"conversations": db.list_conversations_for(username)}), 200


@engagement_bp.route("/messages/<other_user>", methods=["GET"])
@login_required(roles=["admin", "teacher", "student"])
def get_conversation(other_user):
    username = session["user"]["username"]
    return jsonify({"messages": db.list_conversation(username, other_user)}), 200


@engagement_bp.route("/messages", methods=["POST"])
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


# Which alert channels a user wants.
@engagement_bp.route("/notifications/preferences", methods=["GET"])
@login_required()
def get_prefs():
    prefs = db.get_notification_prefs(session["user"]["username"])
    return jsonify({"preferences": prefs}), 200


@engagement_bp.route("/notifications/preferences", methods=["POST", "PUT"])
@login_required()
def update_prefs():
    data = request.get_json(force=True)
    prefs = {
        "email_alerts": bool(data.get("email_alerts", True)),
        "in_app_alerts": bool(data.get("in_app_alerts", True)),
    }
    db.update_notification_prefs(session["user"]["username"], prefs)
    return jsonify({"message": "Preferences saved", "preferences": prefs}), 200
