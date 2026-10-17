import time
import json
from flask import Blueprint, jsonify, Response, stream_with_context
import db
from extensions import login_required

alerts_bp = Blueprint("alerts", __name__, url_prefix="/api/alerts")

# Bound the stream so each connection frees its gunicorn thread instead
# of looping forever. The browser reconnects (see useLiveAlerts).
_STREAM_MAX_SECONDS = 25
_POLL_SECONDS = 3
_HEARTBEAT_SECONDS = 10


@alerts_bp.route("", methods=["GET"])
@login_required(roles=["admin", "teacher", "analyst"])
def get_alerts():
    alerts = db.list_alerts(resolved=False)
    return jsonify({"alerts": alerts, "count": len(alerts)}), 200


@alerts_bp.route("/stream")
@login_required(roles=["admin", "teacher", "analyst"])
def alerts_stream():
    @stream_with_context
    def event_stream():
        started = time.time()
        last_heartbeat = 0.0
        existing = db.list_alerts(resolved=False, limit=200)
        last_seen_ids = set(f"{a['student_id']}-{a['created_at']}" for a in existing)
        # Ask EventSource to retry quickly after we close the stream.
        yield "retry: 2000\n\n"
        while time.time() - started < _STREAM_MAX_SECONDS:
            alerts = db.list_alerts(resolved=False, limit=20)
            for a in alerts:
                key = f"{a['student_id']}-{a['created_at']}"
                if key not in last_seen_ids:
                    last_seen_ids.add(key)
                    yield f"data: {json.dumps(a, default=str)}\n\n"
            now = time.time()
            if now - last_heartbeat >= _HEARTBEAT_SECONDS:
                yield ": heartbeat\n\n"
                last_heartbeat = now
            time.sleep(_POLL_SECONDS)
        yield ": stream-end\n\n"

    return Response(
        event_stream(),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
