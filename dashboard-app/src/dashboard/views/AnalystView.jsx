import React, { useState, useEffect } from "react";
import {
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { ChevronRight, LineChart as LineIcon } from "lucide-react";
import { COLORS, apiGet, SectionLabel, LoadingNote, ErrorNote, KpiRow } from "../shared";

function CohortComparisonPanel() {
  const [riskA, setRiskA] = useState("high");
  const [riskB, setRiskB] = useState("safe");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function compare() {
    setLoading(true);
    try {
      const res = await apiGet(`/cohort/compare?group_a_risk=${riskA}&group_b_risk=${riskB}`);
      setResult(res);
    } catch { /* leave result as-is */ }
    setLoading(false);
  }
  useEffect(() => { compare(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const rows = result ? [
    ["Count", result.group_a.count, result.group_b.count],
    ["Avg Attendance", result.group_a.avg_attendance, result.group_b.avg_attendance],
    ["Avg Score", result.group_a.avg_score, result.group_b.avg_score],
    ["Avg GPA", result.group_a.avg_gpa, result.group_b.avg_gpa],
    ["High-Risk %", `${result.group_a.high_risk_pct ?? 0}%`, `${result.group_b.high_risk_pct ?? 0}%`],
  ] : [];

  return (
    <div>
      <div style={{ display: "flex", gap: 14, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 16 }}>
        <div>
          <label style={{ fontSize: 10.5, textTransform: "uppercase", color: COLORS.muted, display: "block", marginBottom: 4 }}>Group A</label>
          <select value={riskA} onChange={e => setRiskA(e.target.value)} style={{ padding: "6px 8px", border: `1px solid ${COLORS.line}`, fontSize: 12.5 }}>
            <option value="high">High risk</option>
            <option value="safe">Safe</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: 10.5, textTransform: "uppercase", color: COLORS.muted, display: "block", marginBottom: 4 }}>Group B</label>
          <select value={riskB} onChange={e => setRiskB(e.target.value)} style={{ padding: "6px 8px", border: `1px solid ${COLORS.line}`, fontSize: 12.5 }}>
            <option value="high">High risk</option>
            <option value="safe">Safe</option>
          </select>
        </div>
        <button onClick={compare} disabled={loading} className="ep-btn ep-btn-primary" style={{ padding: "7px 16px", background: COLORS.brass, border: "none", color: "#FFFFFF", fontWeight: 600, fontSize: 12.5, cursor: "pointer" }}>
          {loading ? "Comparing…" : "Compare"}
        </button>
      </div>
      {result && (
        <div className="ep-scroll-x">
          <table style={{ borderCollapse: "collapse", fontSize: 12.5, minWidth: 360 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${COLORS.line}` }}>
                <th style={{ textAlign: "left", padding: "6px 12px 6px 0", color: COLORS.muted, fontWeight: 500 }}></th>
                <th style={{ textAlign: "left", padding: "6px 12px", color: COLORS.text }}>Group A</th>
                <th style={{ textAlign: "left", padding: "6px 12px", color: COLORS.text }}>Group B</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, a, b]) => (
                <tr key={label} style={{ borderBottom: `1px solid ${COLORS.line}` }}>
                  <td style={{ padding: "6px 12px 6px 0", color: COLORS.muted }}>{label}</td>
                  <td style={{ padding: "6px 12px", fontFamily: "'IBM Plex Mono', monospace" }}>{a}</td>
                  <td style={{ padding: "6px 12px", fontFamily: "'IBM Plex Mono', monospace" }}>{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function AnalystView() {
  const [summary, setSummary] = useState(null);
  const [students, setStudents] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [correlations, setCorrelations] = useState(null);
  const [error, setError] = useState("");

  function load() {
    setError("");
    Promise.all([
      apiGet("/dashboard/summary"),
      apiGet("/students"),
      apiGet("/model/metrics"),
      apiGet("/analytics/correlations"),
    ]).then(([summaryRes, studentsRes, metricsRes, correlationsRes]) => {
      setSummary(summaryRes);
      setStudents(studentsRes.students || []);
      setMetrics(metricsRes);
      setCorrelations(correlationsRes.correlations || {});
    }).catch(e => setError(e.message || "Couldn't load analytics data."));
  }
  useEffect(load, []);

  if (error) return <div className="ep-page"><ErrorNote message={error} onRetry={load} /></div>;
  if (!summary || !students || !metrics || !correlations) return <div className="ep-page"><LoadingNote>Loading model &amp; cohort analysis…</LoadingNote></div>;

  const correlationData = Object.keys(correlations).length
    ? Object.entries(correlations).map(([feature, value]) => ({ feature, value })).sort((a, b) => a.value - b.value)
    : null;

  const featureImportanceData = metrics.feature_importance
    ? Object.entries(metrics.feature_importance).map(([feature, value]) => ({ feature, value })).sort((a, b) => b.value - a.value)
    : [];

  const attendanceBuckets = [
    { bucket: "0-40%", count: students.filter(s => s.attendance_rate < 40).length },
    { bucket: "40-60%", count: students.filter(s => s.attendance_rate >= 40 && s.attendance_rate < 60).length },
    { bucket: "60-80%", count: students.filter(s => s.attendance_rate >= 60 && s.attendance_rate < 80).length },
    { bucket: "80-100%", count: students.filter(s => s.attendance_rate >= 80).length },
  ];

  return (
    <div className="ep-page">
      <SectionLabel icon={LineIcon}>Model & Cohort Analysis</SectionLabel>
      <KpiRow items={[
        { label: "Model Accuracy", value: `${(metrics.accuracy * 100).toFixed(1)}%` },
        { label: "Precision", value: `${(metrics.precision * 100).toFixed(1)}%` },
        { label: "Recall", value: `${(metrics.recall * 100).toFixed(1)}%` },
        { label: "F1 Score", value: `${(metrics.f1_score * 100).toFixed(1)}%` },
      ]} />

      <div className="ep-two-col">
        <div>
          <SectionLabel>Feature Importance</SectionLabel>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={featureImportanceData} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.line} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="feature" width={140} tick={{ fontSize: 10.5 }} />
              <Tooltip />
              <Bar dataKey="value" fill={COLORS.teal} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div>
          <SectionLabel>Attendance Distribution</SectionLabel>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={attendanceBuckets}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.line} />
              <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill={COLORS.brass} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ marginTop: 8 }}>
        <SectionLabel icon={ChevronRight}>Feature Correlation with Dropout Risk</SectionLabel>
        {correlationData ? (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={correlationData} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.line} horizontal={false} />
              <XAxis type="number" domain={[-1, 1]} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="feature" width={160} tick={{ fontSize: 10.5 }} />
              <Tooltip />
              <Bar dataKey="value">
                {correlationData.map((d, i) => <Cell key={i} fill={d.value < 0 ? COLORS.safe : COLORS.risk} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p style={{ fontSize: 12.5, color: COLORS.muted }}>Not enough live data yet — showing once students load from the API.</p>
        )}
        <p style={{ fontSize: 13, color: COLORS.muted, lineHeight: 1.6, maxWidth: 640, marginTop: 10 }}>
          Negative values mean higher values of that feature are associated
          with lower dropout risk (e.g. more attendance → less risk).
          Test score and attendance rate dominate the model's decisions,
          consistent with the cohort-level anomalies flagged in the Spark
          pipeline.
        </p>
      </div>

      <div style={{ marginTop: 32 }}>
        <SectionLabel icon={ChevronRight}>Cohort Comparison</SectionLabel>
        <CohortComparisonPanel />
      </div>
    </div>
  );
}