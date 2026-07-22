import os
from datetime import datetime
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


def init_indexes():
    users_col.create_index("username", unique=True)
    students_col.create_index("student_id", unique=True)


def create_user(username, password, role, full_name=""):
    if users_col.find_one({"username": username}):
        return None, "Username already exists"
    doc = {
        "username": username,
        "password_hash": generate_password_hash(password),
        "role": role,
        "full_name": full_name,
        "created_at": datetime.utcnow(),
    }
    result = users_col.insert_one(doc)
    return str(result.inserted_id), None


def verify_user(username, password):
    user = users_col.find_one({"username": username})
    if not user:
        return None
    if check_password_hash(user["password_hash"], password):
        return {
            "id": str(user["_id"]),
            "username": user["username"],
            "role": user["role"],
            "full_name": user.get("full_name", ""),
        }
    return None


def upsert_student(student_doc):
    students_col.update_one(
        {"student_id": student_doc["student_id"]},
        {"$set": student_doc},
        upsert=True,
    )


def get_student(student_id):
    return students_col.find_one({"student_id": student_id}, {"_id": 0})


def list_students(filter_query=None, limit=50):
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
