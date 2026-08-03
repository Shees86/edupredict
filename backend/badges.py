"""
EduPredict - Achievement badges
==================================
Simple, transparent rule-based badges computed from a student's
current academic record. No separate model or storage needed — a
badge is just a label earned by meeting a threshold on data we
already have.
"""

BADGE_DEFINITIONS = [
    {
        "id": "perfect_attendance",
        "name": "Perfect Attendance",
        "description": "95%+ attendance rate",
        "check": lambda s: (s.get("attendance_rate") or 0) >= 95,
    },
    {
        "id": "top_performer",
        "name": "Top Performer",
        "description": "90+ average test score",
        "check": lambda s: (s.get("avg_test_score") or 0) >= 90,
    },
    {
        "id": "consistent_scholar",
        "name": "Consistent Scholar",
        "description": "GPA of 3.5 or higher",
        "check": lambda s: (s.get("previous_semester_gpa") or 0) >= 3.5,
    },
    {
        "id": "assignment_champion",
        "name": "Assignment Champion",
        "description": "95%+ assignments submitted",
        "check": lambda s: (s.get("assignments_submitted_pct") or 0) >= 95,
    },
    {
        "id": "engaged_learner",
        "name": "Engaged Learner",
        "description": "High LMS engagement (10+ logins/week)",
        "check": lambda s: (s.get("lms_login_frequency_per_week") or 0) >= 10,
    },
    {
        "id": "safe_standing",
        "name": "Safe Standing",
        "description": "Currently not flagged as at-risk",
        "check": lambda s: (s.get("dropout_risk") or 0) == 0,
    },
]


def compute_badges(student_record):
    if not student_record:
        return []
    earned = []
    for badge in BADGE_DEFINITIONS:
        if badge["check"](student_record):
            earned.append({
                "id": badge["id"],
                "name": badge["name"],
                "description": badge["description"],
            })
    return earned
