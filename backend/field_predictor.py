import os
import pickle
import pandas as pd
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "field_model.pkl")
_bundle = None


def _load():
    global _bundle
    if _bundle is None:
        with open(MODEL_PATH, "rb") as f:
            _bundle = pickle.load(f)
    return _bundle


def predict_field_and_college(matric_percentage, science_aptitude=0.5,
                                extracurricular_score=50, city_tier="Urban"):
    bundle = _load()
    feature_cols = bundle["feature_cols"]
    feature_encoders = bundle["feature_encoders"]
    models = bundle["models"]
    raw = {
        "matric_percentage": matric_percentage,
        "science_aptitude": science_aptitude,
        "extracurricular_score": extracurricular_score,
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
        all_probs = {
            cls: round(float(p), 4)
            for cls, p in zip(target_encoder.classes_, proba)
        }
        result[target] = {
            "label": label,
            "confidence": round(float(proba[best_idx]), 4),
            "all_probabilities": all_probs,
        }
    return {
        "recommended_field": result["recommended_field"],
        "college_tier": result["college_tier"],
    }
