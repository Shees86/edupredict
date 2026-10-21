import os
import time
import secrets
import sys
from datetime import timedelta
from flask import Flask, request, jsonify, session
from flask_cors import CORS
from werkzeug.middleware.proxy_fix import ProxyFix

import db
from extensions import stats
from config import FRONTEND_ORIGINS, trust_proxy

from blueprints.auth import auth_bp
from blueprints.admin import admin_bp
from blueprints.students import students_bp
from blueprints.predictions import predictions_bp
from blueprints.alerts import alerts_bp
from blueprints.dashboard import dashboard_bp
from blueprints.feedback import feedback_bp
from blueprints.engagement import engagement_bp

app = Flask(__name__)

_session_idle_timeout = int(os.environ.get("SESSION_IDLE_TIMEOUT_SECONDS", "1800"))
if _session_idle_timeout <= 0:
    raise ValueError("SESSION_IDLE_TIMEOUT_SECONDS must be a positive integer")

# SECURITY: never fall back to a hardcoded secret — anyone who can read
# this public repo would be able to forge session cookies for any
# account, including admin. If FLASK_SECRET_KEY isn't set, generate a
# random one per process instead: sessions won't survive a restart,
# but that's a far safer failure mode than a known, public secret.
_secret = os.environ.get("FLASK_SECRET_KEY")
if not _secret:
    print(
        "WARNING: FLASK_SECRET_KEY is not set. Using a random per-process "
        "secret — all sessions will be invalidated on every restart/redeploy. "
        "Set FLASK_SECRET_KEY in your environment to fix this.",
        file=sys.stderr,
    )
    _secret = secrets.token_hex(32)
app.secret_key = _secret

app.config.update(
    SESSION_COOKIE_SAMESITE="None",
    SESSION_COOKIE_SECURE=True,
    SESSION_COOKIE_HTTPONLY=True,          # JS on the page can't read the session cookie (XSS mitigation)
    PERMANENT_SESSION_LIFETIME=timedelta(seconds=_session_idle_timeout),
    SESSION_IDLE_TIMEOUT_SECONDS=_session_idle_timeout,
    MAX_CONTENT_LENGTH=5 * 1024 * 1024,    # 5 MB cap on any request body — blocks oversized upload abuse
)
CORS(app, supports_credentials=True, origins=FRONTEND_ORIGINS)  # explicit allow-list — never a wildcard "*"

# Only honor X-Forwarded-For / X-Forwarded-Proto when we actually sit
# behind a known reverse proxy. Otherwise a client could spoof those
# headers and bypass per-IP rate limits. ProxyFix uses the *rightmost*
# hops (the ones the proxy appended), not the left-most attacker value.
if trust_proxy():
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1)


# Tracks request volume/duration for /api/system/stats.
@app.before_request
def _track_request_start():
    request._start_time = time.time()
    if "user" in session or "pending_2fa_username" in session:
        now = time.time()
        last_activity = session.get("_last_activity")
        if last_activity is not None and (
            not isinstance(last_activity, (int, float))
            or last_activity > now
            or now - last_activity >= app.config["SESSION_IDLE_TIMEOUT_SECONDS"]
        ):
            session.clear()
            return
        session["_last_activity"] = now
        session.permanent = True


@app.after_request
def _track_request_end(response):
    duration = time.time() - getattr(request, "_start_time", time.time())
    stats["request_count"] += 1
    stats["total_duration"] += duration
    if response.status_code >= 500:
        stats["errors"] += 1
    if "user" in session or "pending_2fa_username" in session:
        session["_last_activity"] = time.time()
        session.permanent = True
    return response


@app.after_request
def _apply_security_headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"
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


# ---------------------------------------------------------------
# Consistent JSON error responses. Without these, Flask's default
# error pages are plain HTML — fine for a browser hitting a page
# directly, but the frontend expects JSON with an "error" field from
# every endpoint, so an unhandled 404/405/500 would otherwise hand it
# a chunk of HTML instead and break silently.
# ---------------------------------------------------------------
@app.errorhandler(400)
def handle_400(e):
    return jsonify({"error": "Bad request.", "status": 400}), 400


@app.errorhandler(401)
def handle_401(e):
    return jsonify({"error": "Not authenticated.", "status": 401}), 401


@app.errorhandler(403)
def handle_403(e):
    return jsonify({"error": "Forbidden.", "status": 403}), 403


@app.errorhandler(404)
def handle_404(e):
    return jsonify({"error": "Not found.", "status": 404}), 404


@app.errorhandler(405)
def handle_405(e):
    return jsonify({"error": "Method not allowed.", "status": 405}), 405


@app.errorhandler(500)
def handle_500(e):
    return jsonify({"error": "Internal server error.", "status": 500}), 500


@app.errorhandler(503)
def handle_503(e):
    return jsonify({"error": "Service temporarily unavailable.", "status": 503}), 503


db.init_indexes()
db.migrate_legacy_defaults()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=os.environ.get("FLASK_DEBUG", "false").lower() == "true")
