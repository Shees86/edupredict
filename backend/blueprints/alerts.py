import time
import json
from flask import Blueprint, jsonify, Response
import db
from extensions import login_required

alerts_bp = Blueprint("alerts", __name__, url_prefix="/api/alerts")


@alerts_bp.route("", methods=["GET"])
@login_required(roles=["admin", "teacher", "analyst"])
def get_alerts():
    alerts = db.list_alerts(resolved=False)
    return jsonify({"alerts": alerts, "count": len(alerts)}), 200


@alerts_bp.route("/stream")
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
