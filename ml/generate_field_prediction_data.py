import numpy as np
import pandas as pd
np.random.seed(7)
N = 3000
FIELDS = ["Pre-Medical", "Pre-Engineering", "Computer Science", "Commerce", "Arts/Humanities"]
TIERS = ["Top-Tier Government College", "Mid-Tier College", "Standard College"]


def pick_field(pct, science_aptitude):
    r = np.random.rand()
    if pct >= 88:
        return "Pre-Medical" if science_aptitude > 0.5 else "Pre-Engineering"
    elif pct >= 78:
        return np.random.choice(["Pre-Engineering", "Computer Science"], p=[0.55, 0.45])
    elif pct >= 65:
        return np.random.choice(["Computer Science", "Commerce"], p=[0.4, 0.6])
    elif pct >= 50:
        return np.random.choice(["Commerce", "Arts/Humanities"], p=[0.55, 0.45])
    else:
        return "Arts/Humanities"


def pick_tier(pct):
    if pct >= 85:
        return "Top-Tier Government College"
    elif pct >= 65:
        return np.random.choice(["Top-Tier Government College", "Mid-Tier College"], p=[0.3, 0.7])
    elif pct >= 45:
        return np.random.choice(["Mid-Tier College", "Standard College"], p=[0.4, 0.6])
    else:
        return "Standard College"


def generate_dataset(n=N):
    matric_percentage = np.clip(np.random.normal(68, 16, n), 33, 100).round(2)
    science_aptitude = np.random.rand(n)
    extracurricular_score = np.clip(np.random.normal(50, 20, n), 0, 100).round(1)
    city_tier = np.random.choice(["Metro", "Urban", "Rural"], n, p=[0.35, 0.4, 0.25])
    fields, tiers = [], []
    for pct, sci in zip(matric_percentage, science_aptitude):
        fields.append(pick_field(pct, sci))
        tiers.append(pick_tier(pct))
    return pd.DataFrame({
        "matric_percentage": matric_percentage,
        "science_aptitude": science_aptitude.round(3),
        "extracurricular_score": extracurricular_score,
        "city_tier": city_tier,
        "recommended_field": fields,
        "college_tier": tiers,
    })
if __name__ == "__main__":
    df = generate_dataset()
    out_path = "/home/claude/EduPredict/data/field_admission_sample.csv"
    df.to_csv(out_path, index=False)
    print(f"Generated {len(df)} rows -> {out_path}")
    print(df["recommended_field"].value_counts())
    print(df["college_tier"].value_counts())
