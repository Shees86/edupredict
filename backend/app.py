import os
import time
from flask import Flask, request, jsonify
from flask_cors import CORS

import db
from extensions import stats
from config import FRONTEND_ORIGIN

from blueprints.auth import auth_bp
from blueprints.admin import admin_bp
from blueprints.students import students_bp
from blueprints.predictions import predictions_bp
from blueprints.alerts import alerts_bp
from blueprints.dashboard import dashboard_bp
from blueprints.feedback import feedback_bp
from blueprints.engagement import engagement_bp

app = Flask(__name__)

app.secret_key = os.environ.get("FLASK_SECRET_KEY", "dev-secret-change-me")
app.config.update(
    SESSION_COOKIE_SAMESITE="None",
    SESSION_COOKIE_SECURE=True,
    SESSION_COOKIE_HTTPONLY=True,          # JS on the page can't read the session cookie (XSS mitigation)
    MAX_CONTENT_LENGTH=5 * 1024 * 1024,    # 5 MB cap on any request body — blocks oversized upload abuse
)
CORS(app, supports_credentials=True, origins=[FRONTEND_ORIGIN])  # never wildcard "*" — only our own frontend


# Tracks request volume/duration for /api/system/stats.
@app.before_request
def _track_request_start():
    request._start_time = time.time()


@app.after_request
def _track_request_end(response):
    duration = time.time() - getattr(request, "_start_time", time.time())
    stats["request_count"] += 1
    stats["total_duration"] += duration
    if response.status_code >= 500:
        stats["errors"] += 1
    return response


@app.after_request
def _apply_security_headers(response):
    # Baseline security headers (safe defaults that won't break the app,
    # unlike a strict CSP which would need per-asset allowlisting).
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


# One blueprint per API area — see blueprints/ for route bodies.
app.register_blueprint(auth_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(students_bp)
app.register_blueprint(predictions_bp)
app.register_blueprint(alerts_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(feedback_bp)
app.register_blueprint(engagement_bp)


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200


if __name__ == "__main__":
    db.init_indexes()
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=os.environ.get("FLASK_DEBUG", "false").lower() == "true")
