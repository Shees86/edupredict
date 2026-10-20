from flask import Blueprint, request, jsonify, session
from bson import ObjectId
import db
from extensions import login_required

feedback_bp = Blueprint("feedback", __name__, url_prefix="/api/feedback")


@feedback_bp.route("", methods=["POST"])
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


@feedback_bp.route("", methods=["GET"])
@login_required(roles=["admin"])
def list_feedback():
    status = request.args.get("status")
    items = db.list_feedback(status=status)
    return jsonify({"feedback": items, "count": len(items)}), 200


@feedback_bp.route("/<feedback_id>/resolve", methods=["POST"])
@login_required(roles=["admin"])
def resolve_feedback_route(feedback_id):
    if not ObjectId.is_valid(feedback_id):
        return jsonify({"error": "Invalid feedback id"}), 400
    if not db.resolve_feedback(feedback_id):
        return jsonify({"error": "Feedback not found"}), 404
    return jsonify({"message": "Marked resolved"}), 200
