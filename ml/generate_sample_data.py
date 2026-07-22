import numpy as np
import pandas as pd
np.random.seed(42)
N = 2000


def generate_dataset(n=N):
    student_id = [f"STU{1000+i}" for i in range(n)]
    age = np.random.randint(17, 26, n)
    gender = np.random.choice(["Male", "Female"], n)
    attendance_rate = np.clip(np.random.normal(78, 15, n), 20, 100)
    avg_test_score = np.clip(np.random.normal(65, 18, n), 0, 100)
    assignments_submitted_pct = np.clip(np.random.normal(75, 20, n), 0, 100)
    family_income_level = np.random.choice(
        ["Low", "Medium", "High"], n, p=[0.35, 0.45, 0.20]
    )
    parental_education = np.random.choice(
        ["None", "Secondary", "Graduate", "Postgraduate"], n,
        p=[0.15, 0.40, 0.35, 0.10]
    )
    study_hours_per_week = np.clip(np.random.normal(10, 5, n), 0, 40)
    extracurricular = np.random.choice(["Yes", "No"], n, p=[0.4, 0.6])
    previous_semester_gpa = np.clip(np.random.normal(2.6, 0.8, n), 0.0, 4.0)
    lms_login_frequency_per_week = np.clip(np.random.normal(5, 3, n), 0, 21).astype(int)
    risk_score = (
        (100 - attendance_rate) * 0.35 +
        (100 - avg_test_score) * 0.30 +
        (100 - assignments_submitted_pct) * 0.15 +
        (4.0 - previous_semester_gpa) * 10 * 0.15 +
        (21 - lms_login_frequency_per_week) * 0.05
    )
    risk_score += np.random.normal(0, 8, n)
    dropout_risk = (risk_score > np.percentile(risk_score, 70)).astype(int)
    df = pd.DataFrame({
        "student_id": student_id,
        "age": age,
        "gender": gender,
        "attendance_rate": attendance_rate.round(2),
        "avg_test_score": avg_test_score.round(2),
        "assignments_submitted_pct": assignments_submitted_pct.round(2),
        "family_income_level": family_income_level,
        "parental_education": parental_education,
        "study_hours_per_week": study_hours_per_week.round(2),
        "extracurricular": extracurricular,
        "previous_semester_gpa": previous_semester_gpa.round(2),
        "lms_login_frequency_per_week": lms_login_frequency_per_week,
        "dropout_risk": dropout_risk,
    })
    return df
if __name__ == "__main__":
    df = generate_dataset()
    out_path = "/home/claude/EduPredict/data/students_sample.csv"
    df.to_csv(out_path, index=False)
    print(f"Generated {len(df)} rows -> {out_path}")
    print(df["dropout_risk"].value_counts(normalize=True))
