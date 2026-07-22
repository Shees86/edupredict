import os
import pickle
import pandas as pd
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "university_model.pkl")
_bundle = None


def _load():
    global _bundle
    if _bundle is None:
        with open(MODEL_PATH, "rb") as f:
            _bundle = pickle.load(f)
    return _bundle


def predict_university(intermediate_percentage, entry_test_score=None, field="Computer Science", city_tier="Urban"):
    bundle = _load()
    feature_cols = bundle["feature_cols"]
    feature_encoders = bundle["feature_encoders"]
    models = bundle["models"]
    if entry_test_score is None:
        entry_test_score = intermediate_percentage
    raw = {
        "intermediate_percentage": intermediate_percentage,
        "entry_test_score": entry_test_score,
        "field": field,
        "city_tier": city_tier,
    }
    row = []
    for col in feature_cols:
        val = raw[col]
        if col in feature_encoders:
            le = feature_encoders[col]
            val = str(val) if val is not None else "Urban"
            if val not in le.classes_:
                val = le.classes_[0]
            val = le.transform([val])[0]
        row.append(val)
    row_df = pd.DataFrame([row], columns=feature_cols)
    result = {}
    for target, entry in models.items():
        model = entry["model"]
        target_encoder = entry["target_encoder"]
        proba = model.predict_proba(row_df)[0]
        best_idx = proba.argmax()
        label = target_encoder.inverse_transform([best_idx])[0]
        result[target] = {
            "label": label,
            "confidence": round(float(proba[best_idx]), 4),
        }
    return {
        "suggested_program": result["suggested_program"],
        "university_tier": result["university_tier"],
    }
