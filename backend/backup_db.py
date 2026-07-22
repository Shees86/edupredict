"""
EduPredict - Manual database backup
======================================
MongoDB Atlas's free (M0) tier does not include automated backups —
that's a paid-tier feature. This script is a practical substitute:
it exports every collection to timestamped JSON files, which you can
run manually before major changes, or schedule via cron/Task
Scheduler for regular backups.

Run with the same MONGO_URI you use elsewhere:
    export MONGO_URI="mongodb+srv://...."   (Mac/Linux)
    $env:MONGO_URI="mongodb+srv://...."     (Windows PowerShell)
    python3 backup_db.py

Restore manually via mongoimport, or write a companion restore
script if needed — this tool only exports.
"""

import os
import json
from datetime import datetime

import db

COLLECTIONS = {
    "users": db.users_col,
    "students": db.students_col,
    "predictions": db.predictions_col,
    "alerts": db.alerts_col,
    "feedback": db.feedback_col,
}


def default_serializer(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    return str(obj)


def main():
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    backup_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backups", timestamp)
    os.makedirs(backup_dir, exist_ok=True)

    for name, collection in COLLECTIONS.items():
        docs = list(collection.find({}))
        for d in docs:
            d["_id"] = str(d["_id"])
        out_path = os.path.join(backup_dir, f"{name}.json")
        with open(out_path, "w") as f:
            json.dump(docs, f, default=default_serializer, indent=2)
        print(f"  {name}: {len(docs)} documents -> {out_path}")

    print(f"\nBackup complete: {backup_dir}")


if __name__ == "__main__":
    main()
