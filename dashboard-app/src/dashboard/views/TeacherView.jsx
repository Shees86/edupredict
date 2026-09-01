import React, { useState, useEffect, useCallback } from "react";
import { BookOpen, Search } from "lucide-react";
import {
  COLORS, apiGet, apiPost, SectionLabel, LoadingNote, ErrorNote,
  RiskBadge, CsvUploadWidget,
} from "../shared";
import { PredictorSuite } from "../predictors";

export function TeacherView() {
  const [students, setStudents] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [predicting, setPredicting] = useState(null);
  const [result, setResult] = useState(null);
  const [predictError, setPredictError] = useState("");

  const load = useCallback((query = "") => {
    setError("");
    const endpoint = query ? `/students?search=${encodeURIComponent(query)}` : "/students";
    apiGet(endpoint).then(d => setStudents(d.students || [])).catch(e => setError(e.message || "Couldn't load the class roster."));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      load(search.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [load, search]);

  const runPrediction = useCallback(async (s) => {
    setPredicting(s.student_id);
    setResult(null);
    setPredictError("");
    const payload = {
      student_id: s.student_id, age: 20,
      attendance_rate: s.attendance_rate, avg_test_score: s.avg_test_score,
      assignments_submitted_pct: s.assignments_submitted_pct ?? 70, study_hours_per_week: s.study_hours_per_week ?? 8,
      previous_semester_gpa: s.previous_semester_gpa, lms_login_frequency_per_week: s.lms_login_frequency_per_week ?? 5,
      gender: s.gender || "Male", family_income_level: s.family_income_level || "Medium",
      parental_education: s.parental_education || "Secondary", extracurricular: s.extracurricular || "No",
    };
    try {
      const res = await apiPost("/predict", payload);
      setResult(res);
    } catch (e) {
      setPredictError(e.message || "Prediction failed.");
    } finally {
      setPredicting(null);
    }
  }, []);

  if (error) return <div className="ep-page"><ErrorNote message={error} onRetry={load} /></div>;
  if (!students) return <div className="ep-page"><LoadingNote>Loading class roster…</LoadingNote></div>;

  return (
    <div className="ep-page">
      <SectionLabel icon={BookOpen}>Class Roster</SectionLabel>

      <CsvUploadWidget onUploaded={load} />

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18, maxWidth: 320 }}>
        <Search size={14} color={COLORS.muted} />
        <input placeholder="Search student ID…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ border: "none", borderBottom: `1px solid ${COLORS.line}`, background: "transparent", padding: "6px 4px", fontSize: 13, width: "100%", fontFamily: "'IBM Plex Sans', sans-serif" }} />
      </div>

      {students.length === 0 ? (
        <p style={{ fontSize: 12.5, color: COLORS.muted }}>No students registered yet. Upload a CSV above, or students can register their own accounts.</p>
      ) : (
        <div className="ep-teacher-grid">
          <div className="ep-scroll-x">
            <div className="ep-roster-header" style={{ padding: "8px 4px", borderBottom: `1px solid ${COLORS.line}`, fontSize: 11, textTransform: "uppercase", color: COLORS.muted, minWidth: 340 }}>
              <div>Student</div>
              <div className="ep-roster-col-hide">Attend.</div>
              <div className="ep-roster-col-hide">Score</div>
              <div>Action</div>
            </div>
            {(students || []).map(s => (
              <div key={s.student_id} className="ep-roster-row ep-row-hover" style={{ padding: "9px 4px", borderBottom: `1px solid ${COLORS.line}`, fontSize: 13.5, minWidth: 340 }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{s.student_id}</div>
                <div className="ep-roster-col-hide" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{s.attendance_rate ?? "—"}%</div>
                <div className="ep-roster-col-hide" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{s.avg_test_score ?? "—"}</div>
                <button onClick={() => runPrediction(s)} disabled={predicting === s.student_id} className="ep-btn"
                  style={{ fontSize: 11.5, background: "none", border: `1px solid ${COLORS.teal}`, color: COLORS.teal, padding: "4px 8px", cursor: "pointer" }}>
                  {predicting === s.student_id ? "…" : "Predict"}
                </button>
              </div>
            ))}
          </div>

          <div>
            <SectionLabel>Prediction Result</SectionLabel>
            {predictError && <div style={{ fontSize: 12, color: COLORS.risk, marginBottom: 10 }}>{predictError}</div>}
            {!result ? (
              <div style={{ fontSize: 13, color: COLORS.muted, borderLeft: `2px solid ${COLORS.line}`, paddingLeft: 12 }}>
                Select "Predict" on a student to run the trained dropout-risk model against their current metrics.
              </div>
            ) : (
              <div style={{ borderLeft: `3px solid ${result.risk_label === "High Risk" ? COLORS.risk : COLORS.safe}`, paddingLeft: 14 }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 15, marginBottom: 4 }}>{result.student_id}</div>
                <RiskBadge risk={result.risk_label} />
                <div style={{ fontSize: 12.5, color: COLORS.muted, marginTop: 8 }}>
                  Model confidence: {(result.risk_probability * 100).toFixed(1)}%
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ marginTop: 32 }}>
        <PredictorSuite />
      </div>
    </div>
  );
}

