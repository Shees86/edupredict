import os

# Comma-separated list of allowed frontend origins, e.g.
#   FRONTEND_ORIGIN="https://edupredict-woad.vercel.app,https://edupredict-git-main-edu-predict-team.vercel.app"
# Vercel issues more than one valid URL for the same project (a
# production alias, a git-branch alias, preview URLs, etc.), so a
# single hardcoded origin breaks the moment any of those change.
_raw = os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173")
FRONTEND_ORIGINS = [o.strip() for o in _raw.split(",") if o.strip()]

# Kept for any code that still imports the old singular name.
FRONTEND_ORIGIN = FRONTEND_ORIGINS[0] if FRONTEND_ORIGINS else "http://localhost:5173"
