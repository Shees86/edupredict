import math
import numbers
import os
import secrets
from datetime import datetime, timedelta
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/")
DB_NAME = os.environ.get("MONGO_DB_NAME", "edupredict")
client = MongoClient(MONGO_URI)
db = client[DB_NAME]
users_col = db["users"]
students_col = db["students"]
predictions_col = db["predictions"]
alerts_col = db["alerts"]
feedback_col = db["feedback"]
audit_col = db["audit_log"]
goals_col = db["goals"]
messages_col = db["messages"]

# Roles that require admin approval before they can log in. Students
# must also be on the institutional roster and prove ownership of that
# Student ID (matching roster email) — see /api/auth/register.
ROLES_REQUIRING_APPROVAL = {"teacher", "analyst", "student"}

STUDENT_FIELDS = {
    "student_id": str,
    "full_name": str,
    "age": numbers.Real,
    "gender": str,
    "attendance_rate": numbers.Real,
    "avg_test_score": numbers.Real,
    "assignments_submitted_pct": numbers.Real,
    "family_income_level": str,
    "parental_education": str,
    "study_hours_per_week": numbers.Real,
    "extracurricular": str,
    "previous_semester_gpa": numbers.Real,
    "lms_login_frequency_per_week": numbers.Real,
    "dropout_risk": numbers.Real,
    "email": str,
    "student_email": str,
    "contact_email": str,
}


def init_indexes():
    users_col.create_index("username", unique=True)
    students_col.create_index("student_id", unique=True)
    audit_col.create_index("created_at")
    goals_col.create_index("student_id", unique=True)
    messages_col.create_index([("participants", 1), ("created_at", 1)])


def create_user(username, password, role, full_name="", email=""):
    if users_col.find_one({"username": username}):
        return None, "Username already exists"
    status = "pending" if role in ROLES_REQUIRING_APPROVAL else "approved"
    doc = {
        "username": username,
        "password_hash": generate_password_hash(password),
        "role": role,
        "full_name": full_name,
        "email": email,
        "status": status,
        "notification_prefs": {"email_alerts": True, "in_app_alerts": True},
        "totp_enabled": False,
        "created_at": datetime.utcnow(),
    }
    result = users_col.insert_one(doc)
    return str(result.inserted_id), None


def verify_user(username, password):
    """
    Step 1 of login: checks username/password only. Returns a dict
    with pending_2fa=True if the account has TOTP enabled (the caller
    must then call verify_totp_code before considering the user
    logged in) — see /api/auth/login and /api/auth/login/verify-2fa.
    """
    user = users_col.find_one({"username": username})
    if not user:
        return None
    if not check_password_hash(user["password_hash"], password):
        return None
    if user.get("status") == "pending":
        return {"pending_approval": True}
    return {
        "id": str(user["_id"]),
        "username": user["username"],
        "role": user["role"],
        "full_name": user.get("full_name", ""),
        "totp_enabled": user.get("totp_enabled", False),
    }


def list_pending_users():
    items = list(users_col.find({"status": "pending"}, {"password_hash": 0}))
    for it in items:
        it["_id"] = str(it["_id"])
    return items


def approve_user(username):
    users_col.update_one({"username": username}, {"$set": {"status": "approved"}})


def reject_user(username):
    users_col.delete_one({"username": username, "status": "pending"})


def upsert_student(student_doc):
    if not isinstance(student_doc, dict):
        raise ValueError("Student record must be an object")

    unknown_fields = set(student_doc) - STUDENT_FIELDS.keys()
    if unknown_fields:
        fields = ", ".join(sorted(unknown_fields, key=str))
        raise ValueError(f"Unsupported student field(s): {fields}")

    student_id = student_doc.get("student_id")
    if not isinstance(student_id, str) or not student_id.strip():
        raise ValueError("student_id must be a non-empty string")

    for field, value in student_doc.items():
        if value is None:
            continue
        expected_type = STUDENT_FIELDS[field]
        if expected_type is numbers.Real:
            try:
                is_finite = math.isfinite(value)
            except (OverflowError, TypeError):
                is_finite = False
            if isinstance(value, bool) or not isinstance(value, numbers.Real) or not is_finite:
                raise ValueError(f"{field} must be a finite number")
        elif not isinstance(value, expected_type):
            raise ValueError(f"{field} must be a string")

    students_col.update_one(
        {"student_id": student_id},
        {"$set": student_doc},
        upsert=True,
    )


def get_student(student_id):
    return students_col.find_one({"student_id": student_id}, {"_id": 0})


def roster_email(student_record):
    """Email on file for a roster row, if the institution stored one."""
    if not student_record:
        return ""
    for key in ("email", "student_email", "contact_email"):
        val = str(student_record.get(key) or "").strip()
        if val:
            return val.lower()
    return ""


def list_students(filter_query=None, limit=10):
    filter_query = filter_query or {}
    cursor = students_col.find(filter_query, {"_id": 0})
    if filter_query and (limit is None or limit == 0):
        return list(cursor)
    if filter_query:
        return list(cursor)
    if limit is None or limit == 0:
        return list(cursor)
    return list(cursor.limit(limit))


def save_prediction(student_id, risk_label, risk_probability, features_used):
    predictions_col.insert_one({
        "student_id": student_id,
        "risk_label": risk_label,
        "risk_probability": risk_probability,
        "features_used": features_used,
        "predicted_at": datetime.utcnow(),
    })


def create_alert(student_id, message, severity="high"):
    alerts_col.insert_one({
        "student_id": student_id,
        "message": message,
        "severity": severity,
        "created_at": datetime.utcnow(),
        "resolved": False,
    })


def list_alerts(resolved=False, limit=100):
    return list(
        alerts_col.find({"resolved": resolved}, {"_id": 0}).limit(limit)
    )


def create_feedback(username, role, category, message):
    doc = {
        "username": username,
        "role": role,
        "category": category,
        "message": message,
        "status": "open",
        "created_at": datetime.utcnow(),
    }
    result = feedback_col.insert_one(doc)
    return str(result.inserted_id)


def list_feedback(status=None, limit=100):
    query = {"status": status} if status else {}
    items = list(feedback_col.find(query).limit(limit))
    for it in items:
        it["_id"] = str(it["_id"])
    return items


def resolve_feedback(feedback_id):
    from bson import ObjectId
    feedback_col.update_one(
        {"_id": ObjectId(feedback_id)}, {"$set": {"status": "resolved"}}
    )


# TOTP-based 2FA — shared secret + time-based code, no SMS provider needed.
def set_totp_secret(username, secret):
    """Stores a pending (not-yet-confirmed) TOTP secret."""
    users_col.update_one({"username": username}, {"$set": {"totp_secret": secret, "totp_enabled": False}})


def confirm_totp(username):
    users_col.update_one({"username": username}, {"$set": {"totp_enabled": True}})


def disable_totp(username):
    users_col.update_one({"username": username}, {"$set": {"totp_enabled": False, "totp_secret": None}})


def get_totp_secret(username):
    user = users_col.find_one({"username": username})
    return user.get("totp_secret") if user else None


# Short-lived, single-use password-reset tokens (see emailer.py).
def create_reset_token(username):
    if not users_col.find_one({"username": username}):
        return None
    token = secrets.token_urlsafe(32)
    users_col.update_one(
        {"username": username},
        {"$set": {"reset_token": token, "reset_token_expires": datetime.utcnow() + timedelta(minutes=30)}},
    )
    return token


def reset_password_with_token(token, new_password):
    user = users_col.find_one({"reset_token": token})
    if not user or not user.get("reset_token_expires") or user["reset_token_expires"] < datetime.utcnow():
        return False
    users_col.update_one(
        {"username": user["username"]},
        {"$set": {"password_hash": generate_password_hash(new_password)}, "$unset": {"reset_token": "", "reset_token_expires": ""}},
    )
    return True


# Notification preferences — which alert channels a user wants.
def get_notification_prefs(username):
    user = users_col.find_one({"username": username})
    return (user or {}).get("notification_prefs", {"email_alerts": True, "in_app_alerts": True})


def update_notification_prefs(username, prefs):
    users_col.update_one({"username": username}, {"$set": {"notification_prefs": prefs}})


def get_user_email_and_prefs(username):
    """Used when deciding whether to send an email for an alert."""
    user = users_col.find_one({"username": username})
    if not user:
        return None, {}
    return user.get("email") or None, user.get("notification_prefs", {})


def list_alert_recipient_emails():
    """Admin/Teacher emails who have opted in to email alerts."""
    users = users_col.find({
        "role": {"$in": ["admin", "teacher"]},
        "notification_prefs.email_alerts": True,
        "email": {"$nin": [None, ""]},
    })
    return [u["email"] for u in users]


# Audit log — who did what, for admin accountability.
def log_action(actor_username, actor_role, action, target="", details=""):
    audit_col.insert_one({
        "actor_username": actor_username,
        "actor_role": actor_role,
        "action": action,
        "target": target,
        "details": details,
        "created_at": datetime.utcnow(),
    })


def list_audit_log(limit=10):
    items = list(audit_col.find({}, {"_id": 0}).sort("created_at", -1).limit(limit))
    return items


# Self-set student progress goals (e.g. attendance/GPA target).
def set_goal(student_id, goal_type, target_value):
    goals_col.update_one(
        {"student_id": student_id},
        {"$set": {"student_id": student_id, "goal_type": goal_type, "target_value": target_value, "updated_at": datetime.utcnow()}},
        upsert=True,
    )


def get_goal(student_id):
    return goals_col.find_one({"student_id": student_id}, {"_id": 0})


# In-app direct messages between teacher and student.
def send_message(sender, recipient, sender_role, text):
    participants = sorted([sender, recipient])
    messages_col.insert_one({
        "participants": participants,
        "sender": sender,
        "sender_role": sender_role,
        "recipient": recipient,
        "text": text,
        "read": False,
        "created_at": datetime.utcnow(),
    })


def list_conversation(user_a, user_b, limit=100):
    participants = sorted([user_a, user_b])
    items = list(messages_col.find({"participants": participants}, {"_id": 0}).sort("created_at", 1).limit(limit))
    return items


def list_conversations_for(username, limit=50):
    """Returns the most recent message with each person this user has messaged."""
    items = list(messages_col.find({"participants": username}, {"_id": 0}).sort("created_at", -1).limit(limit))
    seen = {}
    for m in items:
        other = m["recipient"] if m["sender"] == username else m["sender"]
        if other not in seen:
            seen[other] = m
    return list(seen.values())
