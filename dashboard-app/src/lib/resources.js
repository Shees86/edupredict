import {
  apiDelete,
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

export async function saveStudent(student) {
  return apiPost("/students", student);
}

export async function deleteStudent(studentId) {
  return apiDelete(`/students/${encodeURIComponent(studentId)}`);
}

export async function predictRisk(student, overrides = {}) {
  const inputs = { ...student, ...overrides };
  return apiPost("/predict", {
    student_id: inputs.student_id,
    ...(inputs.age != null && String(inputs.age).trim() !== "" ? { age: inputs.age } : {}),
    attendance_rate: inputs.attendance_rate,
    avg_test_score: inputs.avg_test_score,
    assignments_submitted_pct: inputs.assignments_submitted_pct ?? 70,
    study_hours_per_week: inputs.study_hours_per_week ?? 8,
    previous_semester_gpa: inputs.previous_semester_gpa,
    lms_login_frequency_per_week: inputs.lms_login_frequency_per_week ?? 5,
    ...(inputs.gender != null && String(inputs.gender).trim() !== "" ? { gender: inputs.gender } : {}),
    family_income_level: inputs.family_income_level || "Medium",
    parental_education: inputs.parental_education || "Secondary",
    extracurricular: inputs.extracurricular || "No",
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

export async function decidePendingUser(username, approve, assignment = {}) {
  return apiPost(
    `/admin/${approve ? "approve" : "reject"}/${encodeURIComponent(username)}`,
    approve ? assignment : {}
  );
}

export async function listAuditLog(page = 1, perPage = 10) {
  return apiGet(`/audit-log?page=${page}&per_page=${perPage}`);
}

export async function getRiskTrend() {
  const data = await apiGet("/analytics/trend");
  return data.trend || [];
}

export async function listFeedback(status = "open") {
  const data = await apiGet(`/feedback?status=${encodeURIComponent(status)}`);
  return data.feedback || [];
}

export async function resolveFeedback(feedbackId) {
  return apiPost(`/feedback/${encodeURIComponent(feedbackId)}/resolve`);
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
