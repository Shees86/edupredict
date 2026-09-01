import os
import pickle
import pandas as pd
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "dropout_model.pkl")
ENCODERS_PATH = os.path.join(BASE_DIR, "label_encoders.pkl")
_model_bundle = None
_encoders = None


def _load():
    global _model_bundle, _encoders
    if _model_bundle is None:
        with open(MODEL_PATH, "rb") as f:
            _model_bundle = pickle.load(f)
        with open(ENCODERS_PATH, "rb") as f:
            _encoders = pickle.load(f)
    return _model_bundle, _encoders


def predict_dropout_risk(student_features: dict):
    bundle, encoders = _load()
    model = bundle["model"]
    feature_cols = bundle["feature_cols"]
    row = []
    for col in feature_cols:
        val = student_features.get(col)
        if col in encoders:
            le = encoders[col]
            val = str(val) if val is not None else "Unknown"
            if val not in le.classes_:
                val = le.classes_[0]
            val = le.transform([val])[0]
        row.append(val)
    row_df = pd.DataFrame([row], columns=feature_cols)
    proba = model.predict_proba(row_df)[0]
    high_risk_proba = float(proba[1])
    label = "High Risk" if high_risk_proba >= 0.5 else "Safe"
    return label, round(high_risk_proba, 4)
