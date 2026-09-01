import React, { useState, useEffect } from "react";
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

