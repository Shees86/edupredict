import React, { useState, useEffect, useCallback } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  ShieldCheck, AlertTriangle, Users, LineChart as LineIcon, Search, Bell,
} from "lucide-react";
import {
  COLORS, apiGet, SectionLabel, LoadingNote, ErrorNote, KpiRow,
  StudentLedger, ExportButton, CsvUploadWidget, PendingApprovalsPanel, AuditLogPanel,
} from "../shared";

export function AdminView() {
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [students, setStudents] = useState(null);
  const [sysStats, setSysStats] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  function load() {
    setError("");
    Promise.all([
      apiGet("/dashboard/summary"),
      apiGet("/alerts"),
      apiGet("/students"),
    ]).then(([summaryRes, alertsRes, studentsRes]) => {
      setSummary(summaryRes);
      setAlerts(alertsRes.alerts || []);
      setStudents(studentsRes.students || []);
    }).catch(e => setError(e.message || "Couldn't load dashboard data."));
    apiGet("/system/stats").then(setSysStats).catch(() => {}); // non-critical, fail silently
  }

  const loadStudents = useCallback((query = "") => {
    const endpoint = query ? `/students?search=${encodeURIComponent(query)}` : "/students";
    apiGet(endpoint).then(d => setStudents(d.students || [])).catch(e => setError(e.message || "Couldn't load the class roster."));
  }, []);

  useEffect(load, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadStudents(search.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [loadStudents, search]);

  if (error) return <div className="ep-page"><ErrorNote message={error} onRetry={load} /></div>;
  if (!summary || !alerts || !students) return <div className="ep-page"><LoadingNote>Loading system overview…</LoadingNote></div>;

  const pieData = [
    { name: "Safe", value: summary.safe_count, color: COLORS.safe },
    { name: "High Risk", value: summary.high_risk_count, color: COLORS.risk },
  ];

  return (
    <div className="ep-page">
      <SectionLabel icon={ShieldCheck}>System Overview</SectionLabel>
      <KpiRow items={[
        { label: "Total Students", value: summary.total_students },
        { label: "High Risk", value: summary.high_risk_count, color: COLORS.risk },
        { label: "Avg Attendance", value: `${summary.avg_attendance}%` },
        { label: "Avg Score", value: summary.avg_score },
      ]} />

      <div className="ep-two-col">
        <div>
          <SectionLabel>Risk Distribution</SectionLabel>
          {summary.total_students > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ fontSize: 12.5, color: COLORS.muted }}>No student records yet.</p>
          )}
        </div>
        <div>
          <SectionLabel icon={Bell}>Active Alerts</SectionLabel>
          {alerts.length === 0 ? (
            <p style={{ fontSize: 12.5, color: COLORS.muted }}>No active alerts right now.</p>
          ) : (
            <div>
              {alerts.slice(0, 5).map((a, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "8px 0", borderBottom: `1px solid ${COLORS.line}` }}>
                  <AlertTriangle size={14} color={COLORS.risk} style={{ marginTop: 2, flexShrink: 0 }} />
                  <span style={{ fontSize: 12.5, color: COLORS.text }}>{a.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {sysStats && (
        <div style={{ marginTop: 32 }}>
          <SectionLabel icon={LineIcon}>System Health</SectionLabel>
          <KpiRow items={[
            { label: "Uptime", value: sysStats.uptime_seconds > 3600 ? `${(sysStats.uptime_seconds / 3600).toFixed(1)}h` : `${Math.round(sysStats.uptime_seconds / 60)}m` },
            { label: "Requests Served", value: sysStats.request_count },
            { label: "Avg Response", value: `${sysStats.avg_response_ms}ms` },
            { label: "Errors", value: sysStats.error_count, color: sysStats.error_count > 0 ? COLORS.risk : COLORS.safe },
          ]} />
        </div>
      )}

      <div className="ep-two-col" style={{ marginTop: 32 }}>
        <div>
          <SectionLabel icon={Users}>Pending Account Approvals</SectionLabel>
          <PendingApprovalsPanel />
        </div>
        <div>
          <SectionLabel icon={ShieldCheck}>Audit Log</SectionLabel>
          <AuditLogPanel />
        </div>
      </div>

      <div style={{ marginTop: 32 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <SectionLabel icon={Users}>Student Register (latest)</SectionLabel>
          <ExportButton data={students} filename="students.csv" />
        </div>
        <CsvUploadWidget onUploaded={load} />
        <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "12px 0 18px", maxWidth: 320 }}>
          <Search size={14} color={COLORS.muted} />
          <input
            placeholder="Search student ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: "none", borderBottom: `1px solid ${COLORS.line}`, background: "transparent", padding: "6px 4px", fontSize: 13, width: "100%", fontFamily: "'IBM Plex Sans', sans-serif" }}
          />
        </div>
        {students.length === 0 ? (
          <p style={{ fontSize: 12.5, color: COLORS.muted }}>No students registered yet.</p>
        ) : (
          <StudentLedger students={students} />
        )}
      </div>
    </div>
  );
}

