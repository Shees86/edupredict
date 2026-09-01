import React, { useState, useEffect } from "react";
import { GraduationCap, BookOpen, LineChart as LineIcon, ChevronRight } from "lucide-react";
import { COLORS, apiPost, apiGet, LoadingNote } from "./shared";

export function FieldPredictor() {
  const [matricPct, setMatricPct] = useState(75);
  const [cityTier, setCityTier] = useState("Urban");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runPrediction() {
    setLoading(true);
    setError("");
    try {
      const res = await apiPost("/predict/field", { matric_percentage: matricPct, city_tier: cityTier });
      setResult(res);
    } catch (e) {
      setError(e.message || "Prediction failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ep-card ep-card-hover" style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <GraduationCap size={15} color={COLORS.brass} />
        <span style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 600, color: COLORS.text }}>
          Field &amp; College Admission Predictor
        </span>
      </div>
      <p style={{ fontSize: 12, color: COLORS.muted, marginBottom: 18 }}>
        Estimate your likely intermediate field and college tier from your matric percentage —
        based on typical merit patterns, for guidance only.
      </p>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 18 }}>
        <div style={{ flex: "1 1 200px" }}>
          <label style={{ fontSize: 11, textTransform: "uppercase", color: COLORS.muted, display: "block", marginBottom: 6 }}>
            Matric percentage: {matricPct}%
          </label>
          <input type="range" min="33" max="100" value={matricPct}
            onChange={e => setMatricPct(Number(e.target.value))}
            style={{ width: "100%" }} />
        </div>
        <div>
          <label style={{ fontSize: 11, textTransform: "uppercase", color: COLORS.muted, display: "block", marginBottom: 6 }}>
            City type
          </label>
          <select value={cityTier} onChange={e => setCityTier(e.target.value)}
            style={{ padding: "8px 10px", border: `1px solid ${COLORS.line}`, fontSize: 13, fontFamily: "'IBM Plex Sans', sans-serif" }}>
            <option>Metro</option>
            <option>Urban</option>
            <option>Rural</option>
          </select>
        </div>
        <button onClick={runPrediction} disabled={loading} className="ep-btn" style={{
          padding: "9px 18px", background: COLORS.brass, border: "none", color: "#16233F",
          fontWeight: 600, fontSize: 13, cursor: "pointer",
        }}>
          {loading ? "Predicting…" : "Predict"}
        </button>
      </div>

      {error && <div style={{ fontSize: 12, color: COLORS.risk, marginBottom: 12 }}>{error}</div>}
      {result && (
        <div className="ep-result-split">
          <div style={{ borderLeft: `3px solid ${COLORS.teal}`, paddingLeft: 14 }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", color: COLORS.muted, marginBottom: 4 }}>Recommended field</div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 600, color: COLORS.text }}>
              {result.recommended_field.label}
            </div>
            <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 4 }}>
              Confidence: {(result.recommended_field.confidence * 100).toFixed(0)}%
            </div>
          </div>
          <div style={{ borderLeft: `3px solid ${COLORS.brass}`, paddingLeft: 14 }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", color: COLORS.muted, marginBottom: 4 }}>Likely college tier</div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 600, color: COLORS.text }}>
              {result.college_tier.label}
            </div>
            <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 4 }}>
              Confidence: {(result.college_tier.confidence * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function UniversityPredictor() {
  const [interPct, setInterPct] = useState(70);
  const [field, setField] = useState("Computer Science");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runPrediction() {
    setLoading(true);
    setError("");
    try {
      const res = await apiPost("/predict/university", { intermediate_percentage: interPct, field });
      setResult(res);
    } catch (e) {
      setError(e.message || "Prediction failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ep-card ep-card-hover" style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <BookOpen size={15} color={COLORS.brass} />
        <span style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 600, color: COLORS.text }}>
          University Admission Predictor
        </span>
      </div>
      <p style={{ fontSize: 12, color: COLORS.muted, marginBottom: 18 }}>
        Estimate a likely program and university tier from your intermediate percentage.
      </p>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 18 }}>
        <div style={{ flex: "1 1 200px" }}>
          <label style={{ fontSize: 11, textTransform: "uppercase", color: COLORS.muted, display: "block", marginBottom: 6 }}>
            Intermediate percentage: {interPct}%
          </label>
          <input type="range" min="33" max="100" value={interPct}
            onChange={e => setInterPct(Number(e.target.value))} style={{ width: "100%" }} />
        </div>
        <div>
          <label style={{ fontSize: 11, textTransform: "uppercase", color: COLORS.muted, display: "block", marginBottom: 6 }}>
            Field completed
          </label>
          <select value={field} onChange={e => setField(e.target.value)}
            style={{ padding: "8px 10px", border: `1px solid ${COLORS.line}`, fontSize: 13, fontFamily: "'IBM Plex Sans', sans-serif" }}>
            <option>Pre-Medical</option>
            <option>Pre-Engineering</option>
            <option>Computer Science</option>
            <option>Commerce</option>
            <option>Arts/Humanities</option>
          </select>
        </div>
        <button onClick={runPrediction} disabled={loading} className="ep-btn" style={{
          padding: "9px 18px", background: COLORS.brass, border: "none", color: "#16233F",
          fontWeight: 600, fontSize: 13, cursor: "pointer",
        }}>
          {loading ? "Predicting…" : "Predict"}
        </button>
      </div>

      {error && <div style={{ fontSize: 12, color: COLORS.risk, marginBottom: 12 }}>{error}</div>}
      {result && (
        <div className="ep-result-split">
          <div style={{ borderLeft: `3px solid ${COLORS.teal}`, paddingLeft: 14 }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", color: COLORS.muted, marginBottom: 4 }}>Suggested program</div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 600, color: COLORS.text }}>
              {result.suggested_program.label}
            </div>
            <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 4 }}>
              Confidence: {(result.suggested_program.confidence * 100).toFixed(0)}%
            </div>
          </div>
          <div style={{ borderLeft: `3px solid ${COLORS.brass}`, paddingLeft: 14 }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", color: COLORS.muted, marginBottom: 4 }}>Likely university tier</div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 600, color: COLORS.text }}>
              {result.university_tier.label}
            </div>
            <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 4 }}>
              Confidence: {(result.university_tier.confidence * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function CgpaPredictor() {
  const [inputs, setInputs] = useState({
    attendance_rate: 75, avg_test_score: 70, assignments_submitted_pct: 75,
    study_hours_per_week: 10, previous_semester_gpa: 3.0, lms_login_frequency_per_week: 5,
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function setField(key, val) {
    setInputs(prev => ({ ...prev, [key]: val }));
  }

  async function runPrediction() {
    setLoading(true);
    setError("");
    try {
      const res = await apiPost("/predict/cgpa", inputs);
      setResult(res);
    } catch (e) {
      setError(e.message || "Prediction failed.");
    } finally {
      setLoading(false);
    }
  }

  const trendColor = result?.trend === "improving" ? COLORS.safe : result?.trend === "declining" ? COLORS.risk : COLORS.teal;

  return (
    <div className="ep-card ep-card-hover" style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <LineIcon size={15} color={COLORS.brass} />
        <span style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 600, color: COLORS.text }}>
          CGPA Trend Predictor
        </span>
      </div>
      <p style={{ fontSize: 12, color: COLORS.muted, marginBottom: 18 }}>
        Predict next semester's likely GPA from current attendance, scores, and study habits.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 18 }}>
        {[
          ["attendance_rate", "Attendance %"], ["avg_test_score", "Avg test score"],
          ["assignments_submitted_pct", "Assignments %"], ["study_hours_per_week", "Study hrs/wk"],
          ["previous_semester_gpa", "Current GPA"], ["lms_login_frequency_per_week", "LMS logins/wk"],
        ].map(([key, label]) => (
          <div key={key}>
            <label style={{ fontSize: 10.5, textTransform: "uppercase", color: COLORS.muted, display: "block", marginBottom: 4 }}>{label}</label>
            <input type="number" value={inputs[key]} step={key === "previous_semester_gpa" ? 0.1 : 1}
              onChange={e => setField(key, Number(e.target.value))}
              style={{ width: "100%", padding: "6px 8px", border: `1px solid ${COLORS.line}`, fontSize: 13, fontFamily: "'IBM Plex Mono', monospace", boxSizing: "border-box" }} />
          </div>
        ))}
      </div>

      <button onClick={runPrediction} disabled={loading} className="ep-btn" style={{
        padding: "9px 18px", background: COLORS.brass, border: "none", color: "#16233F",
        fontWeight: 600, fontSize: 13, cursor: "pointer", marginBottom: 18,
      }}>
        {loading ? "Predicting…" : "Predict next GPA"}
      </button>

      {error && <div style={{ fontSize: 12, color: COLORS.risk, marginBottom: 12 }}>{error}</div>}
      {result && (
        <div style={{ borderLeft: `3px solid ${trendColor}`, paddingLeft: 14 }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 24, fontWeight: 500, color: COLORS.text }}>
            {result.predicted_next_gpa.toFixed(2)} <span style={{ fontSize: 13, color: COLORS.muted }}>/ 4.00</span>
          </div>
          <div style={{ fontSize: 12, color: trendColor, textTransform: "capitalize", marginTop: 4 }}>
            Trend: {result.trend} (from {result.current_gpa.toFixed(2)})
          </div>
        </div>
      )}
    </div>
  );
}

export function PredictorSuite() {
  const [tab, setTab] = useState("field");
  const tabs = [
    { id: "field", label: "Field & College" },
    { id: "university", label: "University" },
    { id: "cgpa", label: "CGPA Trend" },
  ];
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <ChevronRight size={15} color={COLORS.brass} />
        <span style={{ fontFamily: "'Fraunces', serif", fontSize: 17, fontWeight: 600, color: COLORS.text }}>
          Academic &amp; Career Predictors
        </span>
      </div>
      <div className="ep-tabs" style={{ marginBottom: 16, borderBottom: `1px solid ${COLORS.line}` }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className="ep-btn ep-tab-btn" data-active={tab === t.id} style={{
            padding: "8px 16px", background: "none", border: "none", cursor: "pointer",
            fontSize: 12.5, fontWeight: 600, fontFamily: "'IBM Plex Sans', sans-serif",
            color: tab === t.id ? COLORS.text : COLORS.muted,
            marginBottom: -1,
          }}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === "field" && <FieldPredictor />}
      {tab === "university" && <UniversityPredictor />}
      {tab === "cgpa" && <CgpaPredictor />}
    </div>
  );
}

export function GoalsAndBadges({ studentId, record }) {
  const [goal, setGoal] = useState(null);
  const [badgesList, setBadgesList] = useState(null);
  const [goalType, setGoalType] = useState("attendance");
  const [targetValue, setTargetValue] = useState(80);
  const [saved, setSaved] = useState(false);

  function loadGoal() {
    apiGet(`/goals/${studentId}`).then(d => setGoal(d.goal)).catch(() => {});
  }
  useEffect(() => {
    loadGoal();
    apiGet(`/badges/${studentId}`).then(d => setBadgesList(d.badges || [])).catch(() => setBadgesList([]));
  }, [studentId]);

  async function saveGoal() {
    try {
      await apiPost("/goals", { goal_type: goalType, target_value: Number(targetValue) });
      setSaved(true);
      loadGoal();
      setTimeout(() => setSaved(false), 1500);
    } catch { /* silent — non-critical widget */ }
  }

  const currentValueMap = {
    attendance: record?.attendance_rate,
    gpa: record?.previous_semester_gpa,
    test_score: record?.avg_test_score,
  };
  const goalLabels = { attendance: "Attendance %", gpa: "GPA", test_score: "Avg Test Score" };

  return (
    <div className="ep-two-col" style={{ marginBottom: 24 }}>
      <div className="ep-card" style={{ padding: 20 }}>
        <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 15, marginBottom: 10, color: COLORS.text }}>My Goal</div>
        {goal ? (
          <div>
            <div style={{ fontSize: 12.5, color: COLORS.muted, marginBottom: 4 }}>{goalLabels[goal.goal_type]}</div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 20, color: COLORS.text }}>
              {currentValueMap[goal.goal_type] ?? "—"} <span style={{ color: COLORS.muted, fontSize: 13 }}>/ target {goal.target_value}</span>
            </div>
          </div>
        ) : (
          <p style={{ fontSize: 12, color: COLORS.muted, marginBottom: 10 }}>No goal set yet — pick a target below.</p>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
          <select value={goalType} onChange={e => setGoalType(e.target.value)} style={{ padding: "6px 8px", border: `1px solid ${COLORS.line}`, fontSize: 12.5 }}>
            <option value="attendance">Attendance %</option>
            <option value="gpa">GPA</option>
            <option value="test_score">Avg Test Score</option>
          </select>
          <input type="number" value={targetValue} onChange={e => setTargetValue(e.target.value)}
            style={{ width: 80, padding: "6px 8px", border: `1px solid ${COLORS.line}`, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12.5 }} />
          <button onClick={saveGoal} className="ep-btn" style={{ fontSize: 12, background: COLORS.brass, border: "none", color: "#16233F", fontWeight: 600, padding: "6px 12px", cursor: "pointer" }}>
            {saved ? "Saved ✓" : "Set goal"}
          </button>
        </div>
      </div>

      <div className="ep-card" style={{ padding: 20 }}>
        <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 15, marginBottom: 10, color: COLORS.text }}>Achievements</div>
        {!badgesList ? <LoadingNote>Loading…</LoadingNote> : badgesList.length === 0 ? (
          <p style={{ fontSize: 12, color: COLORS.muted }}>No badges earned yet — keep going!</p>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {badgesList.map(b => (
              <span key={b.id} title={b.description} className="ep-stamp ep-stamp-safe" style={{ transform: "none" }}>
                🏅 {b.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
