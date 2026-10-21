import os

# Comma-separated list of allowed frontend origins, e.g.
#   FRONTEND_ORIGIN="https://edupredict-blue.vercel.app,https://edupredict-git-main-edu-predict-team.vercel.app"
# Vercel issues more than one valid URL for the same project (a
# production alias, a git-branch alias, preview URLs, etc.), so a
# single hardcoded origin breaks the moment any of those change.
_raw = os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173")
FRONTEND_ORIGINS = [o.strip() for o in _raw.split(",") if o.strip()]

# Kept for any code that still imports the old singular name.
FRONTEND_ORIGIN = FRONTEND_ORIGINS[0] if FRONTEND_ORIGINS else "http://localhost:5173"


def trust_proxy():
    """Whether to treat this process as sitting behind a reverse proxy
    (Render, nginx, etc.). When true, Flask/Werkzeug may use the
    *rightmost* forwarded-for hop that the proxy itself added. When
    false, we ignore X-Forwarded-For entirely so callers cannot spoof
    their IP for rate limits."""
    raw = os.environ.get("TRUST_PROXY", "").strip().lower()
    if raw in ("1", "true", "yes", "on"):
        return True
    if raw in ("0", "false", "no", "off"):
        return False
    # Render sets RENDER=true on every web service.
    return os.environ.get("RENDER", "").strip().lower() in ("1", "true")
