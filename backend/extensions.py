"""Shared decorators and in-process state used by more than one
blueprint (kept out of app.py to avoid circular imports)."""
import time
from functools import wraps
from flask import request, jsonify, session

# In-process request stats, exposed via admin.system_stats().
stats = {"start_time": time.time(), "request_count": 0, "total_duration": 0.0, "errors": 0}


def login_required(roles=None):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            user = session.get("user")
            if not user:
                return jsonify({"error": "Not authenticated"}), 401
            if roles and user["role"] not in roles:
                return jsonify({"error": "Forbidden: insufficient role"}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator


# In-memory, per-IP rate limiter for auth endpoints. Not distributed —
# fine for a single backend instance, resets on restart.
_rate_limit_hits = {}


def rate_limit(max_attempts=8, window_seconds=60):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            # Never read X-Forwarded-For here. If we are behind a trusted
            # proxy, ProxyFix (see app.py) has already set remote_addr to
            # the real client. Otherwise remote_addr is the TCP peer, and
            # a caller-supplied X-Forwarded-For header is ignored.
            client_ip = request.remote_addr or "unknown"
            key = f"{fn.__name__}:{client_ip}"
            now = time.time()
            attempts = [t for t in _rate_limit_hits.get(key, []) if now - t < window_seconds]
            if len(attempts) >= max_attempts:
                return jsonify({"error": "Too many attempts — please wait a minute and try again."}), 429
            attempts.append(now)
            _rate_limit_hits[key] = attempts
            return fn(*args, **kwargs)
        return wrapper
    return decorator
