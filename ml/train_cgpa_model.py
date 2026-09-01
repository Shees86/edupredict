import os
import pickle
import json
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_absolute_error, r2_score
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH = os.path.join(BASE_DIR, "data", "students_sample.csv")
MODEL_OUT_PATH = os.path.join(BASE_DIR, "backend", "cgpa_model.pkl")
METRICS_OUT_PATH = os.path.join(BASE_DIR, "backend", "cgpa_model_metrics.json")
NUMERIC_COLS = [
    "attendance_rate", "avg_test_score", "assignments_submitted_pct",
    "study_hours_per_week", "previous_semester_gpa", "lms_login_frequency_per_week",
]
CATEGORICAL_COLS = ["extracurricular"]


def synthesize_next_gpa(df):
    momentum = df["previous_semester_gpa"]
    signal = (
        df["attendance_rate"] / 100 * 1.2 +
        df["avg_test_score"] / 100 * 1.6 +
        df["assignments_submitted_pct"] / 100 * 0.6 +
        df["study_hours_per_week"] / 40 * 0.4
    )
    next_gpa = 0.55 * momentum + 0.45 * signal + np.random.normal(0, 0.15, len(df))
    return np.clip(next_gpa, 0.0, 4.0).round(2)


def train():
    df = pd.read_csv(CSV_PATH)
    df["next_semester_gpa"] = synthesize_next_gpa(df)
    encoders = {}
    for col in CATEGORICAL_COLS:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col].astype(str))
        encoders[col] = le
    feature_cols = NUMERIC_COLS + CATEGORICAL_COLS
    X = df[feature_cols]
    y = df["next_semester_gpa"]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model = RandomForestRegressor(n_estimators=200, max_depth=8, min_samples_leaf=5, random_state=42)
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    metrics = {
        "mae": round(float(mean_absolute_error(y_test, y_pred)), 4),
        "r2_score": round(float(r2_score(y_test, y_pred)), 4),
        "feature_importance": dict(zip(feature_cols, model.feature_importances_.round(4).tolist())),
    }
    print("CGPA regression metrics:", json.dumps(metrics, indent=2))
    with open(MODEL_OUT_PATH, "wb") as f:
        pickle.dump({"model": model, "feature_cols": feature_cols, "encoders": encoders}, f)
    with open(METRICS_OUT_PATH, "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"Saved model -> {MODEL_OUT_PATH}")
if __name__ == "__main__":
    train()
