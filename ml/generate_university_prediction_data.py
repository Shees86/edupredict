import numpy as np
import pandas as pd
np.random.seed(11)
N = 3000
FIELDS = ["Pre-Medical", "Pre-Engineering", "Computer Science", "Commerce", "Arts/Humanities"]
PROGRAMS = ["Medicine (MBBS)", "Engineering", "Computer Science", "Business Administration", "Social Sciences"]
UNI_TIERS = ["Top Public University", "Mid-Tier Public University", "Private University"]
FIELD_TO_PROGRAM_BIAS = {
    "Pre-Medical": "Medicine (MBBS)",
    "Pre-Engineering": "Engineering",
    "Computer Science": "Computer Science",
    "Commerce": "Business Administration",
    "Arts/Humanities": "Social Sciences",
}


def pick_program(field, inter_pct):
    preferred = FIELD_TO_PROGRAM_BIAS[field]
    if inter_pct >= 75:
        return preferred
    return np.random.choice(PROGRAMS, p=[0.05, 0.15, 0.25, 0.30, 0.25])


def pick_uni_tier(inter_pct, entry_test_score):
    combined = 0.5 * inter_pct + 0.5 * entry_test_score
    if combined >= 82:
        return np.random.choice(UNI_TIERS, p=[0.75, 0.20, 0.05])
    elif combined >= 65:
        return np.random.choice(UNI_TIERS, p=[0.25, 0.55, 0.20])
    else:
        return np.random.choice(UNI_TIERS, p=[0.05, 0.30, 0.65])


def generate_dataset(n=N):
    intermediate_percentage = np.clip(np.random.normal(66, 15, n), 33, 100).round(2)
    entry_test_score = np.clip(intermediate_percentage + np.random.normal(0, 12, n), 10, 100).round(2)
    field = np.random.choice(FIELDS, n, p=[0.08, 0.18, 0.22, 0.30, 0.22])
    city_tier = np.random.choice(["Metro", "Urban", "Rural"], n, p=[0.35, 0.4, 0.25])
    programs, uni_tiers = [], []
    for f, ip, ets in zip(field, intermediate_percentage, entry_test_score):
        programs.append(pick_program(f, ip))
        uni_tiers.append(pick_uni_tier(ip, ets))
    return pd.DataFrame({
        "intermediate_percentage": intermediate_percentage,
        "entry_test_score": entry_test_score,
        "field": field,
        "city_tier": city_tier,
        "suggested_program": programs,
        "university_tier": uni_tiers,
    })
if __name__ == "__main__":
    df = generate_dataset()
    out_path = "/home/claude/EduPredict/data/university_admission_sample.csv"
    df.to_csv(out_path, index=False)
    print(f"Generated {len(df)} rows -> {out_path}")
    print(df["suggested_program"].value_counts())
    print(df["university_tier"].value_counts())
