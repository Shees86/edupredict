import pandas as pd
NUMERIC_COLS = [
    "attendance_rate", "avg_test_score", "assignments_submitted_pct",
    "study_hours_per_week", "previous_semester_gpa",
    "lms_login_frequency_per_week", "dropout_risk",
]


def compute_correlations(students: list):
    if not students:
        return {}
    df = pd.DataFrame(students)
    cols = [c for c in NUMERIC_COLS if c in df.columns]
    if "dropout_risk" not in cols or len(df) < 2:
        return {}
    corr = df[cols].corr(numeric_only=True)["dropout_risk"].drop("dropout_risk")
    return {k: round(float(v), 4) for k, v in corr.items()}


def compute_risk_trend(students: list, bucket_size: int = 100):
    if not students:
        return []
    df = pd.DataFrame(students).reset_index(drop=True)
    if "dropout_risk" not in df.columns:
        return []
    trend = []
    for i in range(0, len(df), bucket_size):
        chunk = df.iloc[i:i + bucket_size]
        if len(chunk) == 0:
            continue
        trend.append({
            "cohort": f"{i}-{i + len(chunk)}",
            "high_risk_rate": round(float(chunk["dropout_risk"].mean()), 4),
        })
    return trend
