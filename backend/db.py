import math
import numbers
import os
import secrets
from datetime import datetime, timedelta
from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError
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
    "school_id": str,
    "class_id": str,
}


def init_indexes():
    users_col.create_index("username", unique=True)
    students_col.create_index("student_id", unique=True)
    audit_col.create_index("created_at")
    goals_col.create_index("student_id", unique=True)
    messages_col.create_index([("participants", 1), ("created_at", 1)])


def migrate_legacy_defaults():
    users_col.update_many(
        {"status": {"$exists": False}},
        {"$set": {"status": "approved"}},
    )
    students_col.update_many(
        {"school_id": {"$exists": False}},
        {"$set": {"school_id": "main-campus"}},
    )
    students_col.update_many(
        {"class_id": {"$exists": False}},
        {"$set": {"class_id": "general"}},
    )


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
        "school_id": user.get("school_id"),
        "class_id": user.get("class_id"),
        "totp_enabled": user.get("totp_enabled", False),
    }


def list_pending_users():
    unassigned_staff = [
        {
            "status": "approved",
            "role": "teacher",
            "$or": [
                {"school_id": {"$in": [None, ""]}},
                {"class_id": {"$in": [None, ""]}},
            ],
        },
        {
            "status": "approved",
            "role": "analyst",
            "school_id": {"$in": [None, ""]},
        },
    ]
    items = list(users_col.find(
        {"$or": [{"status": "pending"}, *unassigned_staff]},
        {"password_hash": 0},
    ))
    for it in items:
        it["_id"] = str(it["_id"])
        if it.get("status") == "approved":
            it["needs_scope_assignment"] = True
    return items


def approve_user(username, school_id=None, class_id=None):
    fields = {"status": "approved"}
    if school_id is not None:
        fields["school_id"] = school_id
    if class_id is not None:
        fields["class_id"] = class_id
    users_col.update_one({"username": username}, {"$set": fields})


def reject_user(username):
    users_col.delete_one({"username": username, "status": "pending"})


def student_scope_for_user(username, role):
    if role == "admin":
        return {}

    user = users_col.find_one(
        {"username": username},
        {"_id": 0, "role": 1, "school_id": 1, "class_id": 1},
    )
    if not user or user.get("role") != role:
        return None

    school_id = user.get("school_id")
    if not isinstance(school_id, str) or not school_id.strip():
        return None
    scope = {"school_id": school_id}
    if role == "teacher":
        class_id = user.get("class_id")
        if not isinstance(class_id, str) or not class_id.strip():
            return None
        scope["class_id"] = class_id
    elif role != "analyst":
        return None
    return scope


def upsert_student(student_doc, scope=None):
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

    query = {"student_id": student_id}
    if scope:
        query.update(scope)
    try:
        students_col.update_one(query, {"$set": student_doc}, upsert=True)
    except DuplicateKeyError as error:
        if scope:
            raise PermissionError("Student is outside your assigned class or school") from error
        raise


def get_student(student_id, scope=None):
    query = {"student_id": student_id}
    if scope:
        query.update(scope)
    return students_col.find_one(query, {"_id": 0})


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


def student_dashboard_summary():
    pipeline = [
        {"$group": {
            "_id": None,
            "total": {"$sum": 1},
            "high_risk": {
                "$sum": {"$cond": [{"$eq": ["$dropout_risk", 1]}, 1, 0]}
            },
            "attendance_sum": {"$sum": {"$ifNull": ["$attendance_rate", 0]}},
            "score_sum": {"$sum": {"$ifNull": ["$avg_test_score", 0]}},
            "attendance_under_40": {
                "$sum": {"$cond": [{"$lt": [{"$ifNull": ["$attendance_rate", 0]}, 40]}, 1, 0]}
            },
            "attendance_40_60": {
                "$sum": {"$cond": [
                    {"$and": [
                        {"$gte": [{"$ifNull": ["$attendance_rate", 0]}, 40]},
                        {"$lt": [{"$ifNull": ["$attendance_rate", 0]}, 60]},
                    ]},
                    1,
                    0,
                ]}
            },
            "attendance_60_80": {
                "$sum": {"$cond": [
                    {"$and": [
                        {"$gte": [{"$ifNull": ["$attendance_rate", 0]}, 60]},
                        {"$lt": [{"$ifNull": ["$attendance_rate", 0]}, 80]},
                    ]},
                    1,
                    0,
                ]}
            },
            "attendance_80_plus": {
                "$sum": {"$cond": [{"$gte": [{"$ifNull": ["$attendance_rate", 0]}, 80]}, 1, 0]}
            },
        }},
        {"$project": {
            "_id": 0,
            "total_students": "$total",
            "high_risk_count": "$high_risk",
            "safe_count": {"$subtract": ["$total", "$high_risk"]},
            "avg_attendance": {
                "$round": [{"$divide": ["$attendance_sum", "$total"]}, 2]
            },
            "avg_score": {
                "$round": [{"$divide": ["$score_sum", "$total"]}, 2]
            },
            "attendance_under_40": 1,
            "attendance_40_60": 1,
            "attendance_60_80": 1,
            "attendance_80_plus": 1,
        }},
    ]
    return next(iter(students_col.aggregate(pipeline)), {
        "total_students": 0,
        "high_risk_count": 0,
        "safe_count": 0,
        "avg_attendance": 0,
        "avg_score": 0,
        "attendance_under_40": 0,
        "attendance_40_60": 0,
        "attendance_60_80": 0,
        "attendance_80_plus": 0,
    })


def student_feature_correlations(feature_fields):
    group = {"_id": None, "total": {"$sum": 1}}
    for field in feature_fields:
        if field == "dropout_risk":
            continue
        valid_pair = {
            "$and": [{"$isNumber": f"${field}"}, {"$isNumber": "$dropout_risk"}]
        }

        def sum_for(expression):
            return {"$sum": {"$cond": [valid_pair, expression, 0]}}

        group[f"{field}_count"] = sum_for(1)
        group[f"{field}_x"] = sum_for(f"${field}")
        group[f"{field}_y"] = sum_for("$dropout_risk")
        group[f"{field}_xx"] = sum_for({"$multiply": [f"${field}", f"${field}"]})
        group[f"{field}_yy"] = sum_for({"$multiply": ["$dropout_risk", "$dropout_risk"]})
        group[f"{field}_xy"] = sum_for({"$multiply": [f"${field}", "$dropout_risk"]})

    correlations = {}
    for field in feature_fields:
        if field == "dropout_risk":
            continue
        count = "$" + field + "_count"
        x = "$" + field + "_x"
        y = "$" + field + "_y"
        xx = "$" + field + "_xx"
        yy = "$" + field + "_yy"
        xy = "$" + field + "_xy"
        x_variance = {"$subtract": [
            {"$multiply": ["$$n", "$$xx"]},
            {"$multiply": ["$$x", "$$x"]},
        ]}
        y_variance = {"$subtract": [
            {"$multiply": ["$$n", "$$yy"]},
            {"$multiply": ["$$y", "$$y"]},
        ]}
        denominator = {"$sqrt": {"$multiply": ["$$x_variance", "$$y_variance"]}}
        numerator = {"$subtract": [
            {"$multiply": ["$$n", "$$xy"]},
            {"$multiply": ["$$x", "$$y"]},
        ]}
        correlations[field] = {
            "count": count,
            "value": {
                "$let": {
                    "vars": {
                        "n": count,
                        "x": x,
                        "y": y,
                        "xx": xx,
                        "yy": yy,
                        "xy": xy,
                    },
                    "in": {
                        "$let": {
                            "vars": {
                                "x_variance": x_variance,
                                "y_variance": y_variance,
                            },
                            "in": {
                                "$cond": [
                                    {"$and": [
                                        {"$gte": ["$$n", 2]},
                                        {"$gt": [
                                            {"$multiply": [
                                                "$$x_variance",
                                                "$$y_variance",
                                            ]},
                                            0,
                                        ]},
                                    ]},
                                    {"$round": [
                                        {"$divide": [numerator, denominator]},
                                        4,
                                    ]},
                                    None,
                                ]
                            },
                        }
                    },
                }
            },
        }

    pipeline = [
        {"$group": group},
        {"$project": {
            "_id": 0,
            "total": 1,
            "correlations": correlations,
        }},
    ]
    result = next(iter(students_col.aggregate(pipeline)), None)
    if not result or result["total"] < 2:
        return {}
    return {
        field: stats["value"]
        for field, stats in result["correlations"].items()
        if stats["count"] > 0
    }


def student_risk_trend(bucket_size=100):
    pipeline = [
        {"$setWindowFields": {
            "sortBy": {"_id": 1},
            "output": {"row_number": {"$documentNumber": {}}},
        }},
        {"$addFields": {
            "bucket": {"$floor": {
                "$divide": [{"$subtract": ["$row_number", 1]}, bucket_size]
            }}
        }},
        {"$group": {
            "_id": "$bucket",
            "count": {"$sum": 1},
            "risk_sum": {
                "$sum": {"$cond": [{"$isNumber": "$dropout_risk"}, "$dropout_risk", 0]}
            },
            "risk_count": {
                "$sum": {"$cond": [{"$isNumber": "$dropout_risk"}, 1, 0]}
            },
        }},
        {"$sort": {"_id": 1}},
        {"$project": {
            "_id": 0,
            "cohort": {"$concat": [
                {"$toString": {"$multiply": ["$_id", bucket_size]}},
                "-",
                {"$toString": {
                    "$add": [{"$multiply": ["$_id", bucket_size]}, "$count"]
                }},
            ]},
            "high_risk_rate": {
                "$cond": [
                    {"$gt": ["$risk_count", 0]},
                    {"$round": [{"$divide": ["$risk_sum", "$risk_count"]}, 4]},
                    None,
                ]
            },
        }},
    ]
    return list(students_col.aggregate(pipeline))


def compare_student_cohorts(filter_a, filter_b):
    def summary_pipeline(filter_query):
        return [
            {"$match": filter_query},
            {"$group": {
                "_id": None,
                "count": {"$sum": 1},
                "high_risk": {
                    "$sum": {"$cond": [{"$eq": ["$dropout_risk", 1]}, 1, 0]}
                },
                "attendance_sum": {
                    "$sum": {"$ifNull": ["$attendance_rate", 0]}
                },
                "score_sum": {"$sum": {"$ifNull": ["$avg_test_score", 0]}},
                "gpa_sum": {
                    "$sum": {"$ifNull": ["$previous_semester_gpa", 0]}
                },
            }},
            {"$project": {
                "_id": 0,
                "count": 1,
                "avg_attendance": {
                    "$round": [{"$divide": ["$attendance_sum", "$count"]}, 2]
                },
                "avg_score": {
                    "$round": [{"$divide": ["$score_sum", "$count"]}, 2]
                },
                "avg_gpa": {
                    "$round": [{"$divide": ["$gpa_sum", "$count"]}, 2]
                },
                "high_risk_pct": {
                    "$round": [{
                        "$multiply": [
                            {"$divide": ["$high_risk", "$count"]},
                            100,
                        ]
                    }, 1]
                },
            }},
        ]

    result = next(iter(students_col.aggregate([{
        "$facet": {
            "group_a": summary_pipeline(filter_a),
            "group_b": summary_pipeline(filter_b),
        }
    }])), {})

    def cohort_value(key):
        return (result.get(key) or [{"count": 0}])[0]

    return {"group_a": cohort_value("group_a"), "group_b": cohort_value("group_b")}


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


def has_unresolved_alert(student_id):
    return alerts_col.find_one({"student_id": student_id, "resolved": False}) is not None


def list_alerts(resolved=False, limit=100):
    alerts = list(alerts_col.find({"resolved": resolved}).limit(limit))
    for alert in alerts:
        alert["id"] = str(alert.pop("_id"))
    return alerts


def resolve_alert(alert_id):
    from bson import ObjectId
    if not ObjectId.is_valid(alert_id):
        return False
    result = alerts_col.update_one(
        {"_id": ObjectId(alert_id)},
        {"$set": {"resolved": True}},
    )
    return result.matched_count > 0


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
