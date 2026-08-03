import os
import pickle
import json
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH = os.path.join(BASE_DIR, "data", "field_admission_sample.csv")
MODEL_OUT_PATH = os.path.join(BASE_DIR, "backend", "field_model.pkl")
METRICS_OUT_PATH = os.path.join(BASE_DIR, "backend", "field_model_metrics.json")
NUMERIC_COLS = ["matric_percentage", "science_aptitude", "extracurricular_score"]
CATEGORICAL_COLS = ["city_tier"]
TARGETS = ["recommended_field", "college_tier"]


def train():
    df = pd.read_csv(CSV_PATH)
    encoders = {}
    for col in CATEGORICAL_COLS:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col].astype(str))
        encoders[col] = le
    feature_cols = NUMERIC_COLS + CATEGORICAL_COLS
    X = df[feature_cols]
    models = {}
    metrics = {}
    for target in TARGETS:
        y_raw = df[target]
        target_encoder = LabelEncoder()
        y = target_encoder.fit_transform(y_raw)
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        model = RandomForestClassifier(
            n_estimators=200, max_depth=8, min_samples_leaf=5,
            class_weight="balanced", random_state=42,
        )
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        acc = round(accuracy_score(y_test, y_pred), 4)
        print(f"\n--- {target} ---")
        print(classification_report(y_test, y_pred, target_names=target_encoder.classes_))
        models[target] = {"model": model, "target_encoder": target_encoder}
        metrics[target] = {
            "accuracy": acc,
            "classes": target_encoder.classes_.tolist(),
            "feature_importance": dict(zip(feature_cols, model.feature_importances_.round(4).tolist())),
        }
    bundle = {
        "models": models,
        "feature_cols": feature_cols,
        "feature_encoders": encoders,
    }
    os.makedirs(os.path.dirname(MODEL_OUT_PATH), exist_ok=True)
    with open(MODEL_OUT_PATH, "wb") as f:
        pickle.dump(bundle, f)
    with open(METRICS_OUT_PATH, "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"\nSaved model -> {MODEL_OUT_PATH}")
    print(f"Saved metrics -> {METRICS_OUT_PATH}")
if __name__ == "__main__":
    train()
