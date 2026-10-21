"""Exports every MongoDB collection to timestamped JSON files — a
manual substitute for automated backups on Atlas's free tier.

Run with the same MONGO_URI used elsewhere:
    export MONGO_URI="mongodb+srv://...."
    python3 backup_db.py

Export only — restore manually via mongoimport if needed.
"""

import os
import json
from datetime import datetime, timezone

import db

COLLECTIONS = {
    "users": db.users_col,
    "students": db.students_col,
    "predictions": db.predictions_col,
    "alerts": db.alerts_col,
    "feedback": db.feedback_col,
    "goals": db.goals_col,
    "messages": db.messages_col,
    "audit_log": db.audit_col,
}

USER_BACKUP_PROJECTION = {
    "password_hash": 0,
    "totp_secret": 0,
    "reset_token": 0,
    "reset_token_hash": 0,
    "reset_token_expires": 0,
}


def default_serializer(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    return str(obj)


def main():
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    backup_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backups", timestamp)
    os.makedirs(backup_dir, exist_ok=True)

    for name, collection in COLLECTIONS.items():
        projection = USER_BACKUP_PROJECTION if name == "users" else None
        docs = list(collection.find({}, projection) if projection else collection.find({}))
        for d in docs:
            d["_id"] = str(d["_id"])
        out_path = os.path.join(backup_dir, f"{name}.json")
        with open(out_path, "w") as f:
            json.dump(docs, f, default=default_serializer, indent=2)
        print(f"  {name}: {len(docs)} documents -> {out_path}")

    print(f"\nBackup complete: {backup_dir}")


if __name__ == "__main__":
    main()
