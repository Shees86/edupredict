import os
import pickle
import pandas as pd
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "cgpa_model.pkl")
_bundle = None


def _load():
    global _bundle
    if _bundle is None:
        with open(MODEL_PATH, "rb") as f:
            _bundle = pickle.load(f)
    return _bundle


def predict_next_gpa(attendance_rate, avg_test_score, assignments_submitted_pct,
                      study_hours_per_week, previous_semester_gpa,
                      lms_login_frequency_per_week, extracurricular="No"):
    bundle = _load()
    feature_cols = bundle["feature_cols"]
    encoders = bundle["encoders"]
    model = bundle["model"]
    raw = {
        "attendance_rate": attendance_rate,
        "avg_test_score": avg_test_score,
        "assignments_submitted_pct": assignments_submitted_pct,
        "study_hours_per_week": study_hours_per_week,
        "previous_semester_gpa": previous_semester_gpa,
        "lms_login_frequency_per_week": lms_login_frequency_per_week,
        "extracurricular": extracurricular,
    }
    row = []
    for col in feature_cols:
        val = raw[col]
        if col in encoders:
            le = encoders[col]
            val = str(val) if val is not None else "No"
            if val not in le.classes_:
                val = le.classes_[0]
            val = le.transform([val])[0]
        row.append(val)
    row_df = pd.DataFrame([row], columns=feature_cols)
    predicted = float(model.predict(row_df)[0])
    predicted = max(0.0, min(4.0, predicted))
    trend = ("improving" if predicted > previous_semester_gpa + 0.05
              else "declining" if predicted < previous_semester_gpa - 0.05
              else "stable")
    return {
        "predicted_next_gpa": round(predicted, 2),
        "current_gpa": round(float(previous_semester_gpa), 2),
        "trend": trend,
    }
