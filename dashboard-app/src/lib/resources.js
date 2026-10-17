import {
  apiGet,
  apiPost,
} from "@/lib/api";

/**
 * Thin resource layer over the API so views never hand-assemble URLs
 * or reach into response envelopes. Every helper returns the payload
 * the view wants, not the raw response.
 */

export async function getSummary() {
  return apiGet("/dashboard/summary");
}

export async function listStudents(search = "") {
  const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
  const data = await apiGet(`/students${query}`);
  return data.students || [];
}

export async function getStudent(studentId) {
  return apiGet(`/students/${encodeURIComponent(studentId)}`);
}

export async function predictRisk(student) {
  return apiPost("/predict", {
    student_id: student.student_id,
    age: student.age ?? 20,
    attendance_rate: student.attendance_rate,
    avg_test_score: student.avg_test_score,
    assignments_submitted_pct: student.assignments_submitted_pct ?? 70,
    study_hours_per_week: student.study_hours_per_week ?? 8,
    previous_semester_gpa: student.previous_semester_gpa,
    lms_login_frequency_per_week: student.lms_login_frequency_per_week ?? 5,
    gender: student.gender || "Male",
    family_income_level: student.family_income_level || "Medium",
    parental_education: student.parental_education || "Secondary",
    extracurricular: student.extracurricular || "No",
  });
}

export async function listAlerts() {
  const data = await apiGet("/alerts");
  return data.alerts || [];
}

export async function getSystemStats() {
  return apiGet("/system/stats");
}

export async function listPendingUsers() {
  const data = await apiGet("/admin/pending-users");
  return data.pending || [];
}

export async function decidePendingUser(username, approve) {
  return apiPost(`/admin/${approve ? "approve" : "reject"}/${encodeURIComponent(username)}`, {});
}

export async function listAuditLog() {
  const data = await apiGet("/audit-log");
  return data.log || [];
}

export async function getModelMetrics() {
  return apiGet("/model/metrics");
}

export async function getCorrelations() {
  const data = await apiGet("/analytics/correlations");
  return data.correlations || {};
}

export async function compareCohorts({ groupARisk, groupBRisk }) {
  return apiGet(`/cohort/compare?group_a_risk=${groupARisk}&group_b_risk=${groupBRisk}`);
}

export async function getGoal(studentId) {
  const data = await apiGet(`/goals/${encodeURIComponent(studentId)}`);
  return data.goal;
}

export async function setGoal(goalType, targetValue) {
  return apiPost("/goals", { goal_type: goalType, target_value: Number(targetValue) });
}

export async function getBadges(studentId) {
  const data = await apiGet(`/badges/${encodeURIComponent(studentId)}`);
  return data.badges || [];
}

export async function predictField(matricPercentage, cityTier) {
  return apiPost("/predict/field", {
    matric_percentage: Number(matricPercentage),
    city_tier: cityTier,
  });
}

export async function predictUniversity(intermediatePercentage, field) {
  return apiPost("/predict/university", {
    intermediate_percentage: Number(intermediatePercentage),
    field,
  });
}

export async function predictCgpa(inputs) {
  return apiPost("/predict/cgpa", inputs);
}
