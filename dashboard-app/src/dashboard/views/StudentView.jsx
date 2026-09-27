import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from "recharts";
import { GraduationCap } from "lucide-react";
import {
  COLORS, apiGet, SectionLabel, LoadingNote, ErrorNote, KpiRow, RiskBadge,
} from "../shared";
import { PredictorSuite, GoalsAndBadges } from "../predictors";

export function StudentView({ user }) {
  const [record, setRecord] = useState(null);
  const [error, setError] = useState("");

  function load() {
    setError("");
    apiGet(`/students/${user.username}`).then(setRecord).catch(e => setError(e.message || "Couldn't load your record."));
  }
  useEffect(load, [user.username]);

  if (error) return <div className="ep-page"><ErrorNote message={error} onRetry={load} /></div>;
  if (!record) return <div className="ep-page"><LoadingNote>Loading your record…</LoadingNote></div>;

  const high = record.dropout_risk === 1;

  return (
    <div className="ep-page" style={{ maxWidth: 700 }}>
      <SectionLabel icon={GraduationCap}>My Academic Standing</SectionLabel>

      <div className="ep-card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ fontSize: 11, textTransform: "uppercase", color: COLORS.muted, marginBottom: 6 }}>Current status</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <RiskBadge risk={record.dropout_risk} />
          <span style={{ fontSize: 13, color: COLORS.text }}>
            {high
              ? "A few metrics need attention — see below, and reach out to your advisor."
              : "You're tracking well. Keep it up."}
          </span>
        </div>
      </div>

      <KpiRow items={[
        { label: "Attendance", value: `${record.attendance_rate ?? 0}%` },
        { label: "Avg Score", value: record.avg_test_score ?? 0 },
        { label: "GPA", value: record.previous_semester_gpa ?? 0 },
      ]} />

      <div className="ep-card" style={{ padding: 24, marginTop: 24 }}>
        <div style={{ fontSize: 11, textTransform: "uppercase", color: COLORS.muted, marginBottom: 14 }}>
          My key metrics
        </div>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[
                { label: "Attendance", value: record.attendance_rate ?? 0, target: 85 },
                { label: "Test Score", value: record.avg_test_score ?? 0, target: 70 },
                { label: "Assignments", value: record.assignments_submitted_pct ?? 0, target: 90 },
              ]}
              margin={{ top: 4, right: 8, left: -18, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.line} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: COLORS.muted }} axisLine={{ stroke: COLORS.line }} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: COLORS.muted }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v, name, props) => [`${v}%`, `Your score (target: ${props.payload.target}%)`]}
                contentStyle={{ background: COLORS.cardBg, border: `1px solid ${COLORS.line}`, fontSize: 12 }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {[
                  { value: record.attendance_rate ?? 0, target: 85 },
                  { value: record.avg_test_score ?? 0, target: 70 },
                  { value: record.assignments_submitted_pct ?? 0, target: 90 },
                ].map((d, i) => (
                  <Cell key={i} fill={d.value >= d.target ? COLORS.safe : COLORS.risk} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 11, color: COLORS.muted, marginTop: 8 }}>
          <span><span style={{ color: COLORS.muted }}>Study hours/wk:</span> {record.study_hours_per_week ?? 0}</span>
          <span><span style={{ color: COLORS.muted }}>LMS logins/wk:</span> {record.lms_login_frequency_per_week ?? 0}</span>
          <span><span style={{ color: COLORS.muted }}>Extracurricular:</span> {record.extracurricular ?? "No"}</span>
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <GoalsAndBadges studentId={user.username} record={record} />
      </div>

      <SectionLabel>What this is based on</SectionLabel>
      <p style={{ fontSize: 13, color: COLORS.muted, lineHeight: 1.6, marginBottom: 24 }}>
        This estimate comes from your attendance rate, recent test scores, assignment
        completion, and LMS engagement, compared against patterns across the student
        population. It's a signal for early support, not a fixed outcome.
      </p>

      <PredictorSuite />
    </div>
  );
}

