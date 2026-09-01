import os
import json
import pickle
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report
)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PARQUET_PATH = os.path.join(BASE_DIR, "data", "students_clean_parquet")
CSV_FALLBACK_PATH = os.path.join(BASE_DIR, "data", "students_sample.csv")
MODEL_OUT_PATH = os.path.join(BASE_DIR, "backend", "dropout_model.pkl")
ENCODERS_OUT_PATH = os.path.join(BASE_DIR, "backend", "label_encoders.pkl")
METRICS_OUT_PATH = os.path.join(BASE_DIR, "backend", "model_metrics.json")
CATEGORICAL_COLS = ["gender", "family_income_level", "parental_education", "extracurricular"]
NUMERIC_COLS = [
    "age", "attendance_rate", "avg_test_score", "assignments_submitted_pct",
    "study_hours_per_week", "previous_semester_gpa", "lms_login_frequency_per_week"
]
TARGET_COL = "dropout_risk"


def load_data():
    if os.path.isdir(PARQUET_PATH):
        pass
    print(f"Loading training data from: {CSV_FALLBACK_PATH}")
    return pd.read_csv(CSV_FALLBACK_PATH)


def train():
    df = load_data()
    encoders = {}
    for col in CATEGORICAL_COLS:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col].astype(str))
        encoders[col] = le
    feature_cols = NUMERIC_COLS + CATEGORICAL_COLS
    X = df[feature_cols]
    y = df[TARGET_COL]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=8,
        min_samples_leaf=5,
        class_weight="balanced",
        random_state=42,
    )
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    metrics = {
        "accuracy": round(accuracy_score(y_test, y_pred), 4),
        "precision": round(precision_score(y_test, y_pred), 4),
        "recall": round(recall_score(y_test, y_pred), 4),
        "f1_score": round(f1_score(y_test, y_pred), 4),
        "confusion_matrix": confusion_matrix(y_test, y_pred).tolist(),
        "feature_importance": dict(zip(feature_cols, model.feature_importances_.round(4).tolist())),
    }
    print(classification_report(y_test, y_pred, target_names=["Safe", "High Risk"]))
    print("Metrics:", json.dumps(metrics, indent=2))
    os.makedirs(os.path.dirname(MODEL_OUT_PATH), exist_ok=True)
    with open(MODEL_OUT_PATH, "wb") as f:
        pickle.dump({"model": model, "feature_cols": feature_cols}, f)
    with open(ENCODERS_OUT_PATH, "wb") as f:
        pickle.dump(encoders, f)
    with open(METRICS_OUT_PATH, "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"\nSaved model -> {MODEL_OUT_PATH}")
    print(f"Saved encoders -> {ENCODERS_OUT_PATH}")
    print(f"Saved metrics -> {METRICS_OUT_PATH}")
if __name__ == "__main__":
    train()
