import React, { useState, useEffect } from "react";
import { AlertTriangle, Users } from "lucide-react";

/*
 * Shared building blocks used by the four role dashboards
 * (see ./views/) and by EduPredict-Dashboard.jsx itself: the
 * API_BASE / apiGet / apiPost helpers, the mutable COLORS theme
 * object + applyTheme(), CSV export/upload, and the small
 * presentational atoms (KpiRow, RiskBadge, StudentLedger, the
 * admin approval/audit panels, etc). Nothing here is specific to
 * one role — that's what makes it "shared" rather than living in
 * a single view file.
 */

export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

// Carbon Black for chrome elements (top bars, the settings-cog
// floating button) — these stay black in both themes by design, so
// they're intentionally NOT part of the LIGHT_COLORS/DARK_COLORS
// swap below (unlike COLORS.ink, which is body text and DOES need
// to flip for readability).
export const BRAND_NAVY = "#000000";

// Palette per DESIGN.md — monochrome canvas (warm gray → white →
// black), flat surfaces, no drop shadows. "brass" keeps its old name
// (many components reference COLORS.brass) but now points at Carbon
// Black, matching the design system's "no distinct CTA color —
// primary actions are a solid dark button" rule.
export const LIGHT_COLORS = {
  ink: "#000000",
  inkSoft: "#2F2F2F",
  paper: "#E5E5E5",
  paperDim: "#F3F3F3",
  brass: "#000000",
  brassText: "#000000",
  risk: "#B23A2E",
  safe: "#3E7A54",
  teal: "#2C6E82",
  text: "#000000",
  muted: "#666666",
  line: "#C6C6C6",
  cardBg: "#FFFFFF",
};
export const DARK_COLORS = {
  ink: "#F5F5F5",
  inkSoft: "#D8D8D8",
  paper: "#111111",
  paperDim: "#1A1A1A",
  // A distinct graphite, not the same near-white as "ink" — buttons
  // need to stand out against the near-black canvas while staying
  // dark enough that the (hardcoded white) button text stays readable.
  brass: "#2F2F2F",
  brassText: "#F5F5F5",
  risk: "#E07A6C",
  safe: "#5FAE7C",
  teal: "#4FA3BE",
  text: "#F5F5F5",
  muted: "#9A9A9A",
  line: "#333333",
  cardBg: "#1A1A1A",
};
// A mutable object (not reassigned) so every `COLORS.xxx` reference
// throughout the app — hundreds of them — picks up new values the
// instant the theme toggles, without needing every component to be
// rewired to a context/hook. See toggleTheme() below.
export const COLORS = { ...LIGHT_COLORS };
export let _isDarkTheme = typeof window !== "undefined" && window.localStorage?.getItem("ep-theme") === "dark";
if (_isDarkTheme) Object.assign(COLORS, DARK_COLORS);

// Kept alongside COLORS/LIGHT_COLORS/DARK_COLORS so the mutation and
// the state it touches can never drift apart across files.
export function applyTheme(isDark) {
  Object.assign(COLORS, isDark ? DARK_COLORS : LIGHT_COLORS);
  _isDarkTheme = isDark;
  try { window.localStorage.setItem("ep-theme", isDark ? "dark" : "light"); } catch { /* ignore */ }
}

export { apiGet, apiPost, apiPostFile, exportToCsv };

// Tracks whether a user is currently logged in client-side, so a 401
// from an already-authenticated view (session expired mid-use) can be
// told apart from a 401 from the login form itself (wrong password —
// which should NOT trigger a global "log out" redirect).
let _isAuthenticated = false;
export function setAuthenticated(v) { _isAuthenticated = v; }

function _apiError(message, status) {
  const err = new Error(message);
  err.status = status;
  if (status === 401 && _isAuthenticated) {
    window.dispatchEvent(new CustomEvent("ep:session-expired"));
  }
  return err;
}

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`, { credentials: "include" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw _apiError(body.error || `Request failed (${res.status})`, res.status);
  }
  return res.json();
}
async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw _apiError(errBody.error || `Request failed (${res.status})`, res.status);
  }
  return res.json();
}
async function apiPostFile(path, file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw _apiError(errBody.error || `Request failed (${res.status})`, res.status);
  }
  return res.json();
}
function exportToCsv(filename, rows) {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (val) => {
    const s = val === null || val === undefined ? "" : String(val);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.join(","), ...rows.map(r => headers.map(h => escape(r[h])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
export { ExportButton, LoadingNote, ErrorNote, CsvUploadWidget, SectionLabel, KpiRow, KpiCell, RiskBadge, StudentLedger, PendingApprovalsPanel, AuditLogPanel };

function ExportButton({ data, filename }) {
  return (
    <button onClick={() => exportToCsv(filename, data)} disabled={!data || data.length === 0} className="ep-btn" style={{
      fontSize: 11.5, background: "none", border: `1px solid ${COLORS.teal}`, color: COLORS.teal, padding: "5px 10px", cursor: "pointer",
    }}>
      Export CSV
    </button>
  );
}

function LoadingNote({ children = "Loading…" }) {
  return <div style={{ padding: "20px 0", fontSize: 13, color: COLORS.muted }}>{children}</div>;
}
function ErrorNote({ message, onRetry }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10,
      padding: "12px 16px", background: "rgba(194,72,59,0.06)", border: `1px solid ${COLORS.risk}`, marginBottom: 20, fontSize: 12.5,
    }}>
      <span style={{ display: "flex", alignItems: "center", gap: 8, color: "#A33A2F" }}>
        <AlertTriangle size={14} style={{ flexShrink: 0 }} /> {message}
      </span>
      {onRetry && (
        <button onClick={onRetry} className="ep-btn" style={{ background: "none", border: `1px solid ${COLORS.risk}`, color: "#A33A2F", padding: "4px 10px", fontSize: 12, cursor: "pointer" }}>
          Retry
        </button>
      )}
    </div>
  );
}

function CsvUploadWidget({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError("");
    setResult(null);
    try {
      const res = await apiPostFile("/data/ingest", file);
      setResult(res);
      setFile(null);
      if (onUploaded) onUploaded();
    } catch (e) {
      setError(e.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="ep-card" style={{ padding: 20, marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <Users size={15} color={COLORS.brass} />
        <span style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 600, color: COLORS.text }}>
          Upload Student Records (CSV or JSON)
        </span>
      </div>
      <p style={{ fontSize: 12, color: COLORS.muted, marginBottom: 14 }}>
        Batch-add or update student academic records — CSV or JSON. Required field: <code>student_id</code>.
        Recognized numeric fields: attendance_rate, avg_test_score, assignments_submitted_pct,
        study_hours_per_week, previous_semester_gpa, lms_login_frequency_per_week, dropout_risk.
      </p>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <input type="file" accept=".csv,.json" onChange={e => setFile(e.target.files[0] || null)}
          style={{ fontSize: 12.5, fontFamily: "'IBM Plex Sans', sans-serif" }} />
        <button onClick={handleUpload} disabled={!file || uploading} className="ep-btn ep-btn-primary" style={{
          padding: "8px 16px", background: COLORS.brass, border: "none", color: "#FFFFFF",
          fontWeight: 600, fontSize: 12.5, cursor: "pointer",
        }}>
          {uploading ? "Uploading…" : "Upload"}
        </button>
      </div>
      {error && <div style={{ fontSize: 12, color: COLORS.risk, marginTop: 10 }}>{error}</div>}
      {result && (
        <div style={{ fontSize: 12, color: COLORS.safe, marginTop: 10 }}>
          Done — {result.inserted} record(s) added/updated{result.skipped ? `, ${result.skipped} skipped` : ""}.
          {result.errors && result.errors.length > 0 && (
            <div style={{ color: COLORS.risk, marginTop: 4 }}>
              {result.errors.length} row error(s) — check your CSV column names match the ones above.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SectionLabel({ children, icon: Icon }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
      {Icon && <Icon size={15} color={COLORS.brass} />}
      <span style={{ fontFamily: "'Fraunces', serif", fontSize: 17, fontWeight: 600, color: COLORS.text }}>{children}</span>
    </div>
  );
}
function useCountUp(rawValue, duration = 650) {
  const [display, setDisplay] = useState(rawValue);
  useEffect(() => {
    const match = typeof rawValue === "string" ? rawValue.match(/^(-?\d+(\.\d+)?)(.*)$/) : (typeof rawValue === "number" ? [null, String(rawValue), null, ""] : null);
    if (!match) { setDisplay(rawValue); return; }
    const target = parseFloat(match[1]);
    const decimals = (match[1].split(".")[1] || "").length;
    const suffix = match[3] || "";
    if (isNaN(target)) { setDisplay(rawValue); return; }
    let raf, start;
    function step(ts) {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = target * eased;
      setDisplay(`${current.toFixed(decimals)}${suffix}`);
      if (progress < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => raf && cancelAnimationFrame(raf);
  }, [rawValue, duration]);
  return display;
}

function KpiRow({ items }) {
  return (
    <div className="ep-kpi-row">
      {items.map((it) => (
        <KpiCell key={it.label} item={it} />
      ))}
    </div>
  );
}
function KpiCell({ item }) {
  const animated = useCountUp(item.value);
  return (
    <div className="ep-kpi-cell" style={{ "--accent": item.color || COLORS.brass }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: COLORS.muted, marginBottom: 6 }}>{item.label}</div>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 26, fontWeight: 500, color: item.color || COLORS.text }}>{animated}</div>
    </div>
  );
}
function RiskBadge({ risk }) {
  const high = risk === 1 || risk === "High Risk";
  return (
    <span className={`ep-stamp ${high ? "ep-stamp-risk" : "ep-stamp-safe"}`}>
      {high && <span className="ep-pulse-dot" />}
      {high ? "HIGH RISK" : "SAFE"}
    </span>
  );
}
function StudentLedger({ students }) {
  return (
    <div className="ep-scroll-x">
      <div className="ep-ledger-header" style={{ padding: "8px 4px", borderBottom: `1px solid ${COLORS.line}`, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: COLORS.muted, minWidth: 420 }}>
        <div>Student</div>
        <div className="ep-ledger-col-hide">Attendance</div>
        <div>Avg score</div>
        <div className="ep-ledger-col-hide">GPA</div>
        <div>Status</div>
      </div>
      {students.map((s) => (
        <div key={s.student_id} className="ep-ledger-row ep-row-hover" style={{ padding: "10px 4px", borderBottom: `1px solid ${COLORS.line}`, fontSize: 13.5, minWidth: 420 }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{s.student_id}</div>
          <div className="ep-ledger-col-hide" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{s.attendance_rate?.toFixed ? s.attendance_rate.toFixed(1) : s.attendance_rate}%</div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{s.avg_test_score}</div>
          <div className="ep-ledger-col-hide" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{s.previous_semester_gpa}</div>
          <div><RiskBadge risk={s.dropout_risk} /></div>
        </div>
      ))}
    </div>
  );
}

function PendingApprovalsPanel() {
  const [pending, setPending] = useState(null);
  const [error, setError] = useState("");

  function load() {
    apiGet("/admin/pending-users").then(d => setPending(d.pending || [])).catch(e => setError(e.message));
  }
  useEffect(load, []);

  async function decide(username, approve) {
    try {
      await apiPost(`/admin/${approve ? "approve" : "reject"}/${encodeURIComponent(username)}`, {});
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  if (error) return <div style={{ fontSize: 12, color: COLORS.risk }}>{error}</div>;
  if (!pending) return <LoadingNote>Loading pending accounts…</LoadingNote>;
  if (pending.length === 0) return <p style={{ fontSize: 12.5, color: COLORS.muted }}>No accounts awaiting approval.</p>;

  return (
    <div>
      {pending.map((u) => (
        <div key={u.username} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${COLORS.line}`, flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13.5 }}>{u.username}</div>
            <div style={{ fontSize: 11.5, color: COLORS.muted, textTransform: "capitalize" }}>{u.role} — {u.full_name || "no name given"}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => decide(u.username, true)} className="ep-btn" style={{ fontSize: 11.5, background: "none", border: `1px solid ${COLORS.safe}`, color: COLORS.safe, padding: "5px 10px", cursor: "pointer" }}>
              Approve
            </button>
            <button onClick={() => decide(u.username, false)} className="ep-btn" style={{ fontSize: 11.5, background: "none", border: `1px solid ${COLORS.risk}`, color: COLORS.risk, padding: "5px 10px", cursor: "pointer" }}>
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function AuditLogPanel() {
  const [log, setLog] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiGet("/audit-log").then(d => setLog(d.log || [])).catch(e => setError(e.message));
  }, []);

  if (error) return <div style={{ fontSize: 12, color: COLORS.risk }}>{error}</div>;
  if (!log) return <LoadingNote>Loading audit log…</LoadingNote>;
  if (log.length === 0) return <p style={{ fontSize: 12.5, color: COLORS.muted }}>No activity recorded yet.</p>;

  return (
    <div className="ep-scroll-x">
      {log.slice(0, 10).map((entry, i) => (
        <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: `1px solid ${COLORS.line}`, fontSize: 12, minWidth: 380 }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: COLORS.muted, flexShrink: 0 }}>
            {entry.created_at ? new Date(entry.created_at).toLocaleString() : "—"}
          </span>
          <span style={{ color: COLORS.brassText, flexShrink: 0 }}>{entry.actor_username} ({entry.actor_role})</span>
          <span>{entry.action}{entry.target ? ` → ${entry.target}` : ""}</span>
        </div>
      ))}
    </div>
  );
}
