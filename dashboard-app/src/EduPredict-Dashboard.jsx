import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  ShieldCheck, AlertTriangle, Users, GraduationCap, LineChart as LineIcon,
  LogOut, Search, BookOpen, Bell, ChevronRight,
} from "lucide-react";
import Hero3D from "./Hero3D";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');`;

function getGlobalCss() {
  return `
  /* Smooth scroll, no visible scrollbar (still fully scrollable — this
     just hides the browser's default scrollbar chrome). */
  html { scroll-behavior: smooth; }
  html, body { overflow-x: hidden; }
  ::-webkit-scrollbar { width: 0px; height: 0px; background: transparent; }
  * { scrollbar-width: none; -ms-overflow-style: none; }

  * { box-sizing: border-box; }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }

  .ep-shell { max-width: 1180px; margin: 0 auto; }
  .ep-page { padding: 32px; animation: epFadeUp 0.45s ease both; }
  @media (max-width: 640px) { .ep-page { padding: 20px 16px; } }

  @keyframes epFadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes epFadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes epRise { from { opacity: 0; transform: translateY(16px) scale(0.99); } to { opacity: 1; transform: translateY(0) scale(1); } }
  @keyframes epGrain { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-2%,-2%); } }
  @keyframes epStampIn { 0% { opacity: 0; transform: scale(1.6) rotate(-14deg); } 60% { opacity: 1; } 100% { opacity: 1; transform: scale(1) rotate(-6deg); } }
  @keyframes epPulseRing { 0% { box-shadow: 0 0 0 0 rgba(194,72,59,0.35); } 100% { box-shadow: 0 0 0 8px rgba(194,72,59,0); } }
  @keyframes epCountBlink { from { opacity: 0.4; } to { opacity: 1; } }

  .ep-btn { transition: background 0.15s ease, border-color 0.15s ease, opacity 0.15s ease, transform 0.1s ease, box-shadow 0.15s ease; border-radius: 3px; }
  .ep-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
  .ep-btn:active:not(:disabled) { transform: translateY(0px); }
  .ep-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .ep-btn:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible {
    outline: 2px solid ${COLORS.brass}; outline-offset: 1px;
  }
  .ep-btn-primary { box-shadow: 0 1px 2px rgba(22,35,63,0.15); }
  .ep-btn-primary:hover:not(:disabled) { box-shadow: 0 4px 12px rgba(184,134,46,0.35); }

  .ep-row-hover { transition: background 0.15s ease; }
  .ep-row-hover:hover { background: rgba(184,134,46,0.07); }

  .ep-card {
    background: ${COLORS.cardBg}; border: 1px solid ${COLORS.line}; border-radius: 6px;
    box-shadow: 0 1px 2px rgba(22,35,63,0.04), 0 8px 24px -12px rgba(22,35,63,0.10);
    transition: box-shadow 0.2s ease, transform 0.2s ease;
  }
  .ep-card-hover:hover { box-shadow: 0 4px 8px rgba(22,35,63,0.06), 0 16px 32px -14px rgba(22,35,63,0.16); transform: translateY(-2px); }

  .ep-stagger > * { animation: epRise 0.5s ease both; }
  .ep-stagger > *:nth-child(1) { animation-delay: 0.02s; }
  .ep-stagger > *:nth-child(2) { animation-delay: 0.08s; }
  .ep-stagger > *:nth-child(3) { animation-delay: 0.14s; }
  .ep-stagger > *:nth-child(4) { animation-delay: 0.2s; }

  .ep-logo-mark {
    width: 34px; height: 34px; border: 1.5px solid ${COLORS.brass}; border-radius: 4px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    font-family: 'Fraunces', serif; font-weight: 700; font-size: 16px; color: ${COLORS.brass};
    transform: rotate(-3deg);
  }

  .ep-topbar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
  .ep-topbar-left { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .ep-topbar-right { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
  @media (max-width: 480px) {
    .ep-topbar-username { display: none; }
  }

  .ep-kpi-row { display: flex; flex-wrap: wrap; border-top: 1px solid ${COLORS.line}; border-bottom: 1px solid ${COLORS.line}; margin-bottom: 28px; }
  .ep-kpi-cell { flex: 1 1 130px; padding: 16px 20px; border-left: 1px solid ${COLORS.line}; position: relative; overflow: hidden; }
  .ep-kpi-cell:first-child { border-left: none; }
  .ep-kpi-cell::before {
    content: ""; position: absolute; top: 0; left: 0; width: 100%; height: 2px;
    background: var(--accent, transparent); transform: scaleX(0); transform-origin: left;
    transition: transform 0.4s ease;
  }
  .ep-kpi-cell:hover::before { transform: scaleX(1); }
  @media (max-width: 520px) {
    .ep-kpi-row { display: grid; grid-template-columns: 1fr 1fr; }
    .ep-kpi-cell { border-left: none; border-top: 1px solid ${COLORS.line}; padding: 12px 14px; }
    .ep-kpi-cell:nth-child(-n+2) { border-top: none; }
  }

  .ep-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
  @media (max-width: 860px) { .ep-two-col { grid-template-columns: 1fr; gap: 24px; } }

  .ep-teacher-grid { display: grid; grid-template-columns: 1fr 320px; gap: 32px; }
  @media (max-width: 860px) { .ep-teacher-grid { grid-template-columns: 1fr; } }

  .ep-ledger-header, .ep-ledger-row { display: grid; grid-template-columns: 1fr 100px 100px 100px 90px; align-items: center; }
  .ep-ledger-col-hide { }
  @media (max-width: 620px) {
    .ep-ledger-header, .ep-ledger-row { grid-template-columns: 1fr 90px 90px; }
    .ep-ledger-col-hide { display: none; }
  }

  .ep-roster-header, .ep-roster-row { display: grid; grid-template-columns: 1fr 90px 90px 100px; align-items: center; }
  @media (max-width: 480px) {
    .ep-roster-header, .ep-roster-row { grid-template-columns: 1fr 100px; }
    .ep-roster-col-hide { display: none; }
  }

  .ep-result-split { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  @media (max-width: 520px) { .ep-result-split { grid-template-columns: 1fr; gap: 14px; } }

  .ep-predictor-controls { display: flex; gap: 20px; flex-wrap: wrap; align-items: flex-end; margin-bottom: 18px; }

  .ep-tabs { display: flex; gap: 4px; flex-wrap: wrap; }
  .ep-tab-btn { position: relative; transition: color 0.15s ease; }
  .ep-tab-btn::after {
    content: ""; position: absolute; left: 16px; right: 16px; bottom: -1px; height: 2px;
    background: ${COLORS.brass}; transform: scaleX(0); transform-origin: center; transition: transform 0.25s ease;
  }
  .ep-tab-btn[data-active="true"]::after { transform: scaleX(1); }

  .ep-scroll-x { overflow-x: auto; -webkit-overflow-scrolling: touch; }

  .ep-hero-split { display: grid; grid-template-columns: 1.1fr 0.9fr; align-items: center; gap: 32px; }
  .ep-hero-3d { width: 100%; aspect-ratio: 1 / 1; max-height: 420px; }
  @media (max-width: 880px) {
    .ep-hero-split { grid-template-columns: 1fr; text-align: center; }
    .ep-hero-split > div:first-child { text-align: center; }
    .ep-hero-split > div:first-child > div:last-child { justify-content: center; }
    .ep-hero-3d { max-height: 280px; order: -1; }
  }
  @media (max-width: 560px) {
    .ep-hero-3d { display: none; }
  }

  .ep-feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; }

  .ep-stamp {
    display: inline-flex; align-items: center; gap: 5px; font-family: 'IBM Plex Mono', monospace;
    font-size: 10.5px; font-weight: 500; letter-spacing: 0.06em; padding: 3px 9px;
    border-radius: 3px; animation: epStampIn 0.4s ease both;
  }
  .ep-stamp-risk { background: rgba(194,72,59,0.08); border: 1.5px solid #C2483B; color: #A33A2F; transform: rotate(-2deg); }
  .ep-stamp-safe { background: rgba(62,122,84,0.08); border: 1.5px solid #3E7A54; color: #2F5F41; transform: rotate(-2deg); }
  .ep-pulse-dot { width: 6px; height: 6px; border-radius: 50%; background: #C2483B; animation: epPulseRing 1.6s infinite; }

  .ep-login-shell {
    position: relative; overflow: hidden; min-height: 600px; background: radial-gradient(ellipse 900px 500px at 50% -10%, #1D2C4C 0%, #12203A 55%, #0D1830 100%);
  }
  .ep-login-texture {
    position: absolute; inset: 0; opacity: 0.5; pointer-events: none;
    background-image:
      linear-gradient(rgba(184,134,46,0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(184,134,46,0.05) 1px, transparent 1px);
    background-size: 42px 42px;
    mask-image: radial-gradient(ellipse 700px 500px at 50% 20%, black, transparent 75%);
  }
  .ep-login-card { animation: epRise 0.55s cubic-bezier(0.22,1,0.36,1) both; }
  .ep-login-hero { animation: epFadeIn 0.7s ease both; }

  .ep-feedback-panel { animation: epRise 0.25s ease both; }
`;
}

const LIGHT_COLORS = {
  ink: "#16233F",
  inkSoft: "#28395C",
  paper: "#EDF1F0",
  paperDim: "#E1E6E3",
  brass: "#B8862E",
  risk: "#C2483B",
  safe: "#3E7A54",
  teal: "#2C6E82",
  text: "#1B2433",
  muted: "#5B6472",
  line: "#D3D8D2",
  cardBg: "#FFFFFF",
};
const DARK_COLORS = {
  ink: "#0B1220",
  inkSoft: "#1E2A42",
  paper: "#141B2B",
  paperDim: "#1A2334",
  brass: "#D4A24E",
  risk: "#E07A6C",
  safe: "#5FAE7C",
  teal: "#4FA3BE",
  text: "#E7EAF0",
  muted: "#9AA7C2",
  line: "#2A3550",
  cardBg: "#1B2438",
};
// A mutable object (not reassigned) so every `COLORS.xxx` reference
// throughout the app — hundreds of them — picks up new values the
// instant the theme toggles, without needing every component to be
// rewired to a context/hook. See toggleTheme() below.
const COLORS = { ...LIGHT_COLORS };
let _isDarkTheme = typeof window !== "undefined" && window.localStorage?.getItem("ep-theme") === "dark";
if (_isDarkTheme) Object.assign(COLORS, DARK_COLORS);

function applyTheme(isDark) {
  Object.assign(COLORS, isDark ? DARK_COLORS : LIGHT_COLORS);
  _isDarkTheme = isDark;
  try { window.localStorage.setItem("ep-theme", isDark ? "dark" : "light"); } catch { /* ignore */ }
}

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`, { credentials: "include" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
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
    throw new Error(errBody.error || `Request failed (${res.status})`);
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
    throw new Error(errBody.error || `Request failed (${res.status})`);
  }
  return res.json();
}

/* ---------------- Shared loading/error states ---------------- */
/* ---------------- CSV export (client-side, no library needed) ---------------- */
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

/* ---------------- CSV Upload (data ingestion) ---------------- */
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
        <span style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 600, color: COLORS.ink }}>
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
          padding: "8px 16px", background: COLORS.brass, border: "none", color: "#16233F",
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

export default function EduPredictDashboard() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("landing"); // "landing" | "login" | "register"
  const liveAlert = useLiveAlerts(!!user && ["admin", "teacher", "analyst"].includes(user?.role));
  const [dismissedAlert, setDismissedAlert] = useState(null);

  // Dark mode: COLORS is a mutated shared object (see applyTheme), so
  // toggling this tick just forces the whole tree to re-render and
  // re-read the fresh COLORS.xxx values — no per-component rewiring.
  const [isDark, setIsDark] = useState(_isDarkTheme);
  function toggleTheme() {
    const next = !isDark;
    applyTheme(next);
    setIsDark(next);
  }

  // Language: lightweight dictionary-based i18n (English/Urdu) for
  // the app's primary navigation and section chrome.
  const [lang, setLang] = useState(() => {
    try { return window.localStorage.getItem("ep-lang") || "en"; } catch { return "en"; }
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  function toggleLang() {
    const next = lang === "en" ? "ur" : "en";
    setLang(next);
    try { window.localStorage.setItem("ep-lang", next); } catch { /* ignore */ }
  }
  const t = (key) => (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) || TRANSLATIONS.en[key] || key;

  if (!user) {
    return (
      <>
        <style>{FONT_IMPORT}{getGlobalCss()}</style>
        <AnimatePresence mode="wait">
          {view === "landing" ? (
            <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <LandingPage onLogin={() => setView("login")} onSignup={() => setView("register")} isDark={isDark} onToggleTheme={toggleTheme} lang={lang} onToggleLang={toggleLang} t={t} />
            </motion.div>
          ) : (
            <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <LoginScreen onLogin={setUser} initialMode={view} onBack={() => setView("landing")} t={t} />
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  const showBanner = liveAlert && liveAlert !== dismissedAlert;

  return (
    <>
      <style>{FONT_IMPORT}{getGlobalCss()}</style>
      <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", background: COLORS.paper, minHeight: "600px", color: COLORS.text }}>
        <TopBar user={user} onLogout={() => { setUser(null); setView("landing"); }} isDark={isDark} onToggleTheme={toggleTheme} lang={lang} onToggleLang={toggleLang} t={t} onOpenSettings={() => setSettingsOpen(true)} />
        {showBanner && <LiveAlertBanner alert={liveAlert} onDismiss={() => setDismissedAlert(liveAlert)} />}
        <motion.div key={user.role} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }} className="ep-shell">
          <RoleView role={user.role} user={user} />
        </motion.div>
        <FeedbackWidget user={user} />
        <AnimatePresence>
          {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
        </AnimatePresence>
      </div>
    </>
  );
}

/* ---------------- i18n — lightweight EN/UR dictionary for the
   app's primary navigation and section chrome. Not every string in
   the app is translated yet — this covers the highest-visibility
   text (nav, headers, section titles). ---------------- */
const TRANSLATIONS = {
  en: {
    login: "Log in", signup: "Sign up", signOut: "Sign out",
    admin_view: "admin view", teacher_view: "teacher view", student_view: "student view", analyst_view: "analyst view",
    system_overview: "System Overview", class_roster: "Class Roster", academic_standing: "My Academic Standing",
    model_analysis: "Model & Cohort Analysis", risk_distribution: "Risk Distribution", active_alerts: "Active Alerts",
    student_register: "Student Register (latest)", system_health: "System Health",
    hero_title: "Spot at-risk students before it's too late.",
    get_started: "Get Started", have_account: "I already have an account",
  },
  ur: {
    login: "لاگ ان", signup: "سائن اپ", signOut: "سائن آؤٹ",
    admin_view: "ایڈمن ویو", teacher_view: "ٹیچر ویو", student_view: "طالب علم ویو", analyst_view: "تجزیہ کار ویو",
    system_overview: "سسٹم کا جائزہ", class_roster: "کلاس روسٹر", academic_standing: "میری تعلیمی حیثیت",
    model_analysis: "ماڈل اور کوہورٹ تجزیہ", risk_distribution: "رسک کی تقسیم", active_alerts: "فعال الرٹس",
    student_register: "طلباء کی فہرست (تازہ ترین)", system_health: "سسٹم کی صحت",
    hero_title: "خطرے سے دوچار طلباء کو وقت پر پہچانیں۔",
    get_started: "شروع کریں", have_account: "میرا پہلے سے اکاؤنٹ ہے",
  },
};



/* ---------------- Settings modal (notification prefs + 2FA) ---------------- */
function SettingsModal({ onClose }) {
  const [prefs, setPrefs] = useState(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [totpSetup, setTotpSetup] = useState(null); // { secret, provisioning_uri }
  const [totpCode, setTotpCode] = useState("");
  const [totpMsg, setTotpMsg] = useState("");
  const [me, setMe] = useState(null);

  useEffect(() => {
    apiGet("/notifications/preferences").then((d) => setPrefs(d.preferences)).catch(() => setError("Couldn't load preferences."));
    apiGet("/auth/me").then((d) => setMe(d.user)).catch(() => {});
  }, []);

  async function savePrefs() {
    try {
      await apiPost("/notifications/preferences", prefs);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (e) {
      setError(e.message);
    }
  }

  async function startTotpSetup() {
    setTotpMsg("");
    try {
      const res = await apiPost("/auth/2fa/setup", {});
      setTotpSetup(res);
    } catch (e) {
      setTotpMsg(e.message);
    }
  }

  async function confirmTotp() {
    try {
      await apiPost("/auth/2fa/confirm", { code: totpCode });
      setTotpMsg("Two-factor authentication enabled ✓");
      setTotpSetup(null);
      setTotpCode("");
      setMe((m) => ({ ...m, totp_enabled: true }));
    } catch (e) {
      setTotpMsg(e.message);
    }
  }

  async function disableTotp() {
    try {
      await apiPost("/auth/2fa/disable", {});
      setTotpMsg("Two-factor authentication disabled.");
      setMe((m) => ({ ...m, totp_enabled: false }));
    } catch (e) {
      setTotpMsg(e.message);
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, background: "rgba(11,18,32,0.55)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()} className="ep-card"
        style={{ width: "100%", maxWidth: 420, maxHeight: "85vh", overflowY: "auto", padding: 24, background: COLORS.cardBg }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <span style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 600, color: COLORS.ink }}>Settings</span>
          <button onClick={onClose} className="ep-btn" style={{ background: "none", border: "none", color: COLORS.muted, cursor: "pointer", fontSize: 18 }}>×</button>
        </div>

        <div style={{ fontSize: 11, textTransform: "uppercase", color: COLORS.muted, marginBottom: 10, letterSpacing: "0.06em" }}>Notifications</div>
        {prefs ? (
          <div style={{ marginBottom: 22 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: 8, color: COLORS.text }}>
              <input type="checkbox" checked={prefs.email_alerts} onChange={(e) => setPrefs({ ...prefs, email_alerts: e.target.checked })} />
              Email me when a student is flagged high-risk
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: 12, color: COLORS.text }}>
              <input type="checkbox" checked={prefs.in_app_alerts} onChange={(e) => setPrefs({ ...prefs, in_app_alerts: e.target.checked })} />
              Show real-time in-app alert banner
            </label>
            <button onClick={savePrefs} className="ep-btn ep-btn-primary" style={{ padding: "7px 16px", background: COLORS.brass, border: "none", color: "#16233F", fontWeight: 600, fontSize: 12.5, cursor: "pointer" }}>
              {saved ? "Saved ✓" : "Save preferences"}
            </button>
          </div>
        ) : <LoadingNote>Loading…</LoadingNote>}
        {error && <div style={{ fontSize: 12, color: COLORS.risk, marginBottom: 12 }}>{error}</div>}

        <div style={{ fontSize: 11, textTransform: "uppercase", color: COLORS.muted, marginBottom: 10, letterSpacing: "0.06em", borderTop: `1px solid ${COLORS.line}`, paddingTop: 16 }}>
          Two-Factor Authentication
        </div>
        {me?.totp_enabled ? (
          <div>
            <p style={{ fontSize: 12.5, color: COLORS.safe, marginBottom: 10 }}>2FA is currently enabled on your account.</p>
            <button onClick={disableTotp} className="ep-btn" style={{ padding: "7px 16px", background: "none", border: `1px solid ${COLORS.risk}`, color: COLORS.risk, fontSize: 12.5, cursor: "pointer" }}>
              Disable 2FA
            </button>
          </div>
        ) : totpSetup ? (
          <div>
            <p style={{ fontSize: 12, color: COLORS.muted, marginBottom: 8 }}>
              Add this secret to Google Authenticator / Authy (Setup key: manual entry), then enter the 6-digit code it shows:
            </p>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, background: COLORS.paperDim, padding: "8px 10px", marginBottom: 10, wordBreak: "break-all" }}>
              {totpSetup.secret}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={totpCode} onChange={(e) => setTotpCode(e.target.value)} placeholder="6-digit code"
                style={{ flex: 1, padding: "8px 10px", border: `1px solid ${COLORS.line}`, fontFamily: "'IBM Plex Mono', monospace", fontSize: 13 }} />
              <button onClick={confirmTotp} className="ep-btn ep-btn-primary" style={{ padding: "8px 16px", background: COLORS.brass, border: "none", color: "#16233F", fontWeight: 600, fontSize: 12.5, cursor: "pointer" }}>
                Confirm
              </button>
            </div>
          </div>
        ) : (
          <button onClick={startTotpSetup} className="ep-btn" style={{ padding: "7px 16px", background: "none", border: `1px solid ${COLORS.teal}`, color: COLORS.teal, fontSize: 12.5, cursor: "pointer" }}>
            Enable 2FA
          </button>
        )}
        {totpMsg && <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 10 }}>{totpMsg}</div>}
      </motion.div>
    </motion.div>
  );
}

function LandingPage({ onLogin, onSignup, isDark, onToggleTheme, lang, onToggleLang, t }) {
  const reduceMotion = useReducedMotion();
  const tr = t || ((k) => k);
  const features = [
    { icon: AlertTriangle, title: "Dropout Risk Detection", text: "Trained ML model flags at-risk students early from attendance, scores, and engagement." },
    { icon: GraduationCap, title: "Career Pathway Predictors", text: "Matric/intermediate percentage tools recommend fields, colleges, universities, and CGPA trend." },
    { icon: Bell, title: "Real-Time Alerts", text: "Live, role-based notifications the moment a student is flagged — no page refresh needed." },
    { icon: LineIcon, title: "Cohort Analytics", text: "Correlation analysis and model metrics for institution-wide, data-driven decisions." },
  ];

  const fadeUp = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  };
  const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", background: COLORS.paper, minHeight: "600px", color: COLORS.text, overflowX: "hidden" }}>
      {/* Nav */}
      <motion.div
        initial={reduceMotion ? false : { y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
          padding: "18px 32px", background: COLORS.ink, borderBottom: `3px solid ${COLORS.brass}`,
        }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="ep-logo-mark">E</div>
          <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 19, color: "#F4F1E9" }}>EduPredict</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {onToggleLang && (
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onToggleLang} style={{
              padding: "8px 12px", background: "none", border: `1px solid ${COLORS.inkSoft}`, color: "#F4F1E9",
              fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif", borderRadius: 3,
            }}>
              {lang === "en" ? "اردو" : "EN"}
            </motion.button>
          )}
          {onToggleTheme && (
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onToggleTheme} style={{
              padding: "8px 12px", background: "none", border: `1px solid ${COLORS.inkSoft}`, color: "#F4F1E9",
              fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif", borderRadius: 3,
            }}>
              {isDark ? "☀" : "☾"}
            </motion.button>
          )}
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onLogin} style={{
            padding: "8px 16px", background: "none", border: `1px solid ${COLORS.inkSoft}`, color: "#F4F1E9",
            fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif", borderRadius: 3,
          }}>
            {tr("login")}
          </motion.button>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onSignup} style={{
            padding: "8px 16px", background: COLORS.brass, border: "none", color: "#16233F",
            fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif", borderRadius: 3,
          }}>
            {tr("signup")}
          </motion.button>
        </div>
      </motion.div>

      {/* Hero — text + 3D visual */}
      <div className="ep-hero-split" style={{ maxWidth: 1120, margin: "0 auto", padding: "56px 32px 40px" }}>
        <motion.div variants={stagger} initial="hidden" animate="show" style={{ textAlign: "left" }}>
          <motion.div variants={fadeUp} style={{ fontFamily: "'Fraunces', serif", fontSize: 13, letterSpacing: "0.2em", color: COLORS.brass, textTransform: "uppercase", marginBottom: 14 }}>
            Academic Analytics Portal
          </motion.div>
          <motion.h1 variants={fadeUp} style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: "clamp(32px, 4.6vw, 54px)", color: COLORS.ink, lineHeight: 1.12, margin: "0 0 20px" }}>
            {tr("hero_title")}
          </motion.h1>
          <motion.p variants={fadeUp} style={{ fontSize: 16, color: COLORS.muted, lineHeight: 1.65, margin: "0 0 32px", maxWidth: 480 }}>
            EduPredict combines Hadoop-scale data processing with machine learning to
            predict dropout risk, recommend academic pathways, and give every
            stakeholder — admin, teacher, student, analyst — the view they need.
          </motion.p>
          <motion.div variants={fadeUp} style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <motion.button whileHover={{ scale: 1.03, boxShadow: "0 8px 20px rgba(184,134,46,0.35)" }} whileTap={{ scale: 0.97 }}
              onClick={onSignup} style={{
                padding: "13px 28px", background: COLORS.brass, border: "none", color: "#16233F", borderRadius: 3,
                fontSize: 14.5, fontWeight: 600, cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif",
              }}>
              Get Started
            </motion.button>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={onLogin} style={{
                padding: "13px 28px", background: "none", border: `1px solid ${COLORS.line}`, color: COLORS.ink, borderRadius: 3,
                fontSize: 14.5, fontWeight: 600, cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif",
              }}>
              I already have an account
            </motion.button>
          </motion.div>
        </motion.div>

        <motion.div
          className="ep-hero-3d"
          initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden="true"
        >
          <Hero3D />
        </motion.div>
      </div>

      {/* Features */}
      <div className="ep-page" style={{ maxWidth: 1080, margin: "0 auto", paddingTop: 8 }}>
        <motion.div
          className="ep-feature-grid"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
        >
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div key={i} variants={fadeUp} whileHover={{ y: -4 }} className="ep-card" style={{ padding: 22 }}>
                <Icon size={20} color={COLORS.brass} style={{ marginBottom: 10 }} />
                <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 15.5, color: COLORS.ink, marginBottom: 6 }}>
                  {f.title}
                </div>
                <div style={{ fontSize: 12.5, color: COLORS.muted, lineHeight: 1.55 }}>
                  {f.text}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      <div style={{ textAlign: "center", padding: "40px 20px 60px", fontSize: 11.5, color: COLORS.muted }}>
        Built on Hadoop/HDFS, PySpark, Flask, MongoDB, and React.
      </div>
    </div>
  );
}

/* ---------------- Login / register ---------------- */
function LoginScreen({ onLogin, initialMode = "login", onBack }) {
  const [mode, setMode] = useState(initialMode); // "login" | "register" | "forgot"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [needs2fa, setNeeds2fa] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [devResetToken, setDevResetToken] = useState("");

  const roles = [
    { id: "teacher", label: "Teacher", icon: BookOpen },
    { id: "student", label: "Student", icon: GraduationCap },
    { id: "analyst", label: "Analyst", icon: LineIcon },
  ];

  function fillDemo(demoUsername, demoPassword) {
    setUsername(demoUsername);
    setPassword(demoPassword);
    setError("");
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      setSubmitting(false);
      if (!res.ok) {
        setError(res.status === 401 ? "Incorrect username or password." : (data.error || "Something went wrong signing in."));
        return;
      }
      if (data.needs_2fa) {
        setNeeds2fa(true);
        return;
      }
      onLogin(data.user);
    } catch {
      setSubmitting(false);
      setError("Can't reach the API right now. Check your connection and try again.");
    }
  }

  async function handleVerify2fa(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login/verify-2fa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code: totpCode }),
      });
      const data = await res.json().catch(() => ({}));
      setSubmitting(false);
      if (!res.ok) {
        setError(data.error || "Incorrect code.");
        return;
      }
      onLogin(data.user);
    } catch {
      setSubmitting(false);
      setError("Can't reach the API right now. Check your connection and try again.");
    }
  }

  async function handleForgotPassword(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    setDevResetToken("");
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username }),
      });
      const data = await res.json().catch(() => ({}));
      setSubmitting(false);
      setNotice(data.message || "If that account exists, a reset link has been generated.");
      if (data.dev_reset_token) setDevResetToken(data.dev_reset_token); // no email configured — show it directly for demo/testing
    } catch {
      setSubmitting(false);
      setError("Can't reach the API right now.");
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token: resetToken, new_password: password }),
      });
      const data = await res.json().catch(() => ({}));
      setSubmitting(false);
      if (!res.ok) {
        setError(data.error || "Could not reset password.");
        return;
      }
      setNotice("Password updated — you can sign in now.");
      setMode("login");
      setPassword("");
    } catch {
      setSubmitting(false);
      setError("Can't reach the API right now.");
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    if (!role) {
      setError("Please select a role above before creating an account.");
      return;
    }
    if (!username.trim() || !password.trim()) {
      setError("Username and password are required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password, role, full_name: fullName, email }),
      });
      const data = await res.json().catch(() => ({}));
      setSubmitting(false);
      if (!res.ok) {
        setError(data.error || "Could not create account.");
        return;
      }
      setNotice(data.message || `Account created — you can sign in now as ${role}.`);
      setMode("login");
      setPassword("");
    } catch {
      setSubmitting(false);
      setError("Can't reach the API right now, so accounts can't be created. Check your connection and try again.");
    }
  }

  const isRegister = mode === "register";
  const isForgot = mode === "forgot";

  // 2FA code-entry step — isolated early return so it can't interfere
  // with the main login/register form below.
  if (needs2fa) {
    return (
      <div className="ep-login-shell" style={{ fontFamily: "'IBM Plex Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
        <div className="ep-login-texture" />
        <div style={{ width: "100%", maxWidth: 380, position: "relative" }}>
          <div className="ep-login-hero" style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
              <div className="ep-logo-mark" style={{ width: 44, height: 44, fontSize: 20 }}>E</div>
            </div>
            <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 28, color: "#F4F1E9" }}>Two-Factor Code</div>
            <div style={{ fontSize: 13, color: "#9AA7C2", marginTop: 8 }}>Enter the 6-digit code from your authenticator app</div>
          </div>
          <form onSubmit={handleVerify2fa} className="ep-login-card" style={{ background: "#1D2C4C", border: `1px solid ${COLORS.inkSoft}`, borderRadius: 8, padding: 28, boxShadow: "0 20px 60px -20px rgba(0,0,0,0.5)" }}>
            <label style={labelStyle}>Authentication code</label>
            <input value={totpCode} onChange={e => setTotpCode(e.target.value)} placeholder="123456" style={inputStyle} autoFocus />
            {error && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#F4A79E", fontSize: 12, marginBottom: 10, marginTop: 10 }}>
                <AlertTriangle size={13} style={{ flexShrink: 0 }} /> {error}
              </div>
            )}
            <button type="submit" disabled={submitting} className="ep-btn ep-btn-primary" style={{
              width: "100%", marginTop: 8, padding: "11px 0", background: COLORS.brass, color: "#16233F",
              border: "none", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif",
            }}>
              {submitting ? "Verifying…" : "Verify"}
            </button>
            <button type="button" onClick={() => { setNeeds2fa(false); setTotpCode(""); setError(""); }} className="ep-btn" style={{
              width: "100%", marginTop: 10, padding: "8px 0", background: "none", border: "none", color: "#9AA7C2", fontSize: 12, cursor: "pointer",
            }}>
              ← Back to sign in
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Forgot-password flow — request a reset link, then enter the token
  // (from email, or shown directly if SMTP isn't configured) + new password.
  if (isForgot) {
    return (
      <div className="ep-login-shell" style={{ fontFamily: "'IBM Plex Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
        <div className="ep-login-texture" />
        <div style={{ width: "100%", maxWidth: 380, position: "relative" }}>
          <button onClick={() => { setMode("login"); setError(""); setNotice(""); }} className="ep-btn" style={{
            display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
            color: "#9AA7C2", fontSize: 12.5, cursor: "pointer", marginBottom: 18, fontFamily: "'IBM Plex Sans', sans-serif",
          }}>
            ← Back to sign in
          </button>
          <div className="ep-login-hero" style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 28, color: "#F4F1E9" }}>Reset Password</div>
          </div>
          {!resetToken && !devResetToken ? (
            <form onSubmit={handleForgotPassword} className="ep-login-card" style={{ background: "#1D2C4C", border: `1px solid ${COLORS.inkSoft}`, borderRadius: 8, padding: 28, boxShadow: "0 20px 60px -20px rgba(0,0,0,0.5)" }}>
              <label style={labelStyle}>Username</label>
              <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Your username" style={inputStyle} />
              {notice && <div style={{ color: "#8FCBA0", fontSize: 12, marginTop: 10 }}>{notice}</div>}
              {devResetToken && (
                <div style={{ fontSize: 11, color: "#9AA7C2", marginTop: 8, lineHeight: 1.5 }}>
                  No email is configured on this server, so here's your reset token directly (dev/demo mode only):
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", background: "#16233F", padding: 8, marginTop: 6, wordBreak: "break-all" }}>{devResetToken}</div>
                  <button type="button" onClick={() => setResetToken(devResetToken)} className="ep-btn" style={{ marginTop: 8, background: "none", border: `1px solid ${COLORS.brass}`, color: COLORS.brass, padding: "6px 10px", fontSize: 12, cursor: "pointer" }}>
                    Use this token now
                  </button>
                </div>
              )}
              <button type="submit" disabled={submitting} className="ep-btn ep-btn-primary" style={{
                width: "100%", marginTop: 14, padding: "11px 0", background: COLORS.brass, color: "#16233F",
                border: "none", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif",
              }}>
                {submitting ? "Sending…" : "Send reset link"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="ep-login-card" style={{ background: "#1D2C4C", border: `1px solid ${COLORS.inkSoft}`, borderRadius: 8, padding: 28, boxShadow: "0 20px 60px -20px rgba(0,0,0,0.5)" }}>
              <label style={labelStyle}>Reset token</label>
              <input value={resetToken} onChange={e => setResetToken(e.target.value)} placeholder="Paste your reset token" style={inputStyle} />
              <label style={labelStyle}>New password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Choose a new password" style={inputStyle} />
              {error && <div style={{ color: "#F4A79E", fontSize: 12, marginTop: 10 }}>{error}</div>}
              {notice && <div style={{ color: "#8FCBA0", fontSize: 12, marginTop: 10 }}>{notice}</div>}
              <button type="submit" disabled={submitting} className="ep-btn ep-btn-primary" style={{
                width: "100%", marginTop: 14, padding: "11px 0", background: COLORS.brass, color: "#16233F",
                border: "none", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif",
              }}>
                {submitting ? "Saving…" : "Set new password"}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // --- 2FA code prompt (shown after a successful password check on
  // an account with 2FA enabled) — kept as its own small screen so
  // the main login/register form logic below is untouched. ---
  if (needs2fa) {
    return (
      <div className="ep-login-shell" style={{ fontFamily: "'IBM Plex Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
        <div className="ep-login-texture" />
        <div style={{ width: "100%", maxWidth: 380, position: "relative" }}>
          <div className="ep-login-hero" style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
              <div className="ep-logo-mark" style={{ width: 44, height: 44, fontSize: 20 }}>E</div>
            </div>
            <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 26, color: "#F4F1E9" }}>Enter your 2FA code</div>
            <div style={{ fontSize: 13, color: "#9AA7C2", marginTop: 8 }}>Open your authenticator app and enter the 6-digit code.</div>
          </div>
          <form onSubmit={handleVerify2fa} className="ep-login-card" style={{ background: "#1D2C4C", border: `1px solid ${COLORS.inkSoft}`, borderRadius: 8, padding: 28 }}>
            <label style={labelStyle}>Authentication code</label>
            <input value={totpCode} onChange={e => setTotpCode(e.target.value)} placeholder="123456" style={inputStyle} autoFocus />
            {error && <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#F4A79E", fontSize: 12, marginTop: 10 }}><AlertTriangle size={13} /> {error}</div>}
            <button type="submit" disabled={submitting} className="ep-btn ep-btn-primary" style={{ width: "100%", marginTop: 16, padding: "11px 0", background: COLORS.brass, color: "#16233F", border: "none", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
              {submitting ? "Verifying…" : "Verify & sign in"}
            </button>
            <button type="button" onClick={() => { setNeeds2fa(false); setTotpCode(""); setError(""); }} className="ep-btn" style={{ width: "100%", marginTop: 10, padding: "8px 0", background: "none", border: "none", color: "#9AA7C2", fontSize: 12.5, cursor: "pointer" }}>
              ← Back to sign in
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- Forgot / reset password — also a self-contained screen. ---
  if (isForgot) {
    return (
      <div className="ep-login-shell" style={{ fontFamily: "'IBM Plex Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
        <div className="ep-login-texture" />
        <div style={{ width: "100%", maxWidth: 380, position: "relative" }}>
          <button onClick={() => { setMode("login"); setError(""); setNotice(""); }} className="ep-btn" style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#9AA7C2", fontSize: 12.5, cursor: "pointer", marginBottom: 18 }}>
            ← Back to sign in
          </button>
          <div className="ep-login-hero" style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 26, color: "#F4F1E9" }}>Reset your password</div>
          </div>
          <form onSubmit={resetToken || devResetToken ? handleResetPassword : handleForgotPassword} className="ep-login-card" style={{ background: "#1D2C4C", border: `1px solid ${COLORS.inkSoft}`, borderRadius: 8, padding: 28 }}>
            {!devResetToken ? (
              <>
                <label style={labelStyle}>Username</label>
                <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Your username" style={inputStyle} />
              </>
            ) : (
              <>
                <div style={{ fontSize: 11.5, color: "#8FCBA0", marginBottom: 14, lineHeight: 1.5 }}>
                  No email is configured on this server, so here's your reset token directly (for demo/dev use):
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, background: "#16233F", padding: "8px 10px", marginTop: 6, wordBreak: "break-all" }}>{devResetToken}</div>
                </div>
                <label style={labelStyle}>Reset token</label>
                <input value={resetToken} onChange={e => setResetToken(e.target.value)} placeholder="Paste token" style={inputStyle} />
                <label style={labelStyle}>New password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="New password" style={inputStyle} />
              </>
            )}
            {error && <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#F4A79E", fontSize: 12, marginTop: 10 }}><AlertTriangle size={13} /> {error}</div>}
            {notice && <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#8FCBA0", fontSize: 12, marginTop: 10 }}><ShieldCheck size={13} /> {notice}</div>}
            <button type="submit" disabled={submitting} className="ep-btn ep-btn-primary" style={{ width: "100%", marginTop: 16, padding: "11px 0", background: COLORS.brass, color: "#16233F", border: "none", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
              {submitting ? "Please wait…" : (devResetToken || resetToken ? "Set new password" : "Send reset link")}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="ep-login-shell" style={{
      fontFamily: "'IBM Plex Sans', sans-serif",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px",
    }}>
      <div className="ep-login-texture" />
      <div style={{ width: "100%", maxWidth: 380, position: "relative" }}>
        {onBack && (
          <button onClick={onBack} className="ep-btn" style={{
            display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
            color: "#9AA7C2", fontSize: 12.5, cursor: "pointer", marginBottom: 18, fontFamily: "'IBM Plex Sans', sans-serif",
          }}>
            ← Back to home
          </button>
        )}
        <div className="ep-login-hero" style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <div className="ep-logo-mark" style={{ width: 44, height: 44, fontSize: 20 }}>E</div>
          </div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 13, letterSpacing: "0.2em", color: COLORS.brass, textTransform: "uppercase", marginBottom: 6 }}>
            Academic Analytics
          </div>
          <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 36, color: "#F4F1E9", lineHeight: 1.1 }}>
            EduPredict
          </div>
          <div style={{ fontSize: 13, color: "#9AA7C2", marginTop: 8 }}>
            Dropout risk &amp; performance intelligence
          </div>
        </div>

        <form onSubmit={isRegister ? handleRegister : handleLogin} className="ep-login-card" style={{ background: "#1D2C4C", border: `1px solid ${COLORS.inkSoft}`, borderRadius: 8, padding: 28, boxShadow: "0 20px 60px -20px rgba(0,0,0,0.5)" }}>

          <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#16233F", borderRadius: 5, padding: 3 }}>
            {["login", "register"].map(m => (
              <button key={m} type="button" onClick={() => { setMode(m); setError(""); setNotice(""); }} className="ep-btn"
                style={{
                  flex: 1, padding: "7px 0", border: "none", borderRadius: 3, cursor: "pointer",
                  fontSize: 12.5, fontWeight: 600, fontFamily: "'IBM Plex Sans', sans-serif",
                  background: mode === m ? COLORS.brass : "transparent",
                  color: mode === m ? "#16233F" : "#9AA7C2",
                }}>
                {m === "login" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          {isRegister && (
            <>
              <label style={labelStyle}>Register as</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 18 }}>
                {roles.map(r => {
                  const Icon = r.icon;
                  const active = role === r.id;
                  return (
                    <button type="button" key={r.id} onClick={() => setRole(r.id)} className="ep-btn"
                      style={{
                        display: "flex", alignItems: "center", gap: 6, padding: "8px 10px",
                        border: `1px solid ${active ? COLORS.brass : COLORS.inkSoft}`,
                        background: active ? "rgba(184,134,46,0.14)" : "transparent",
                        color: active ? COLORS.brass : "#9AA7C2",
                        fontSize: 12.5, cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif",
                      }}>
                      <Icon size={14} /> {r.label}
                    </button>
                  );
                })}
              </div>
              <div style={{ fontSize: 10.5, color: "#5E6C8C", marginTop: -12, marginBottom: 16, lineHeight: 1.5 }}>
                Admin accounts can't be self-registered for security reasons — ask an
                existing administrator to set one up for you.
              </div>

              <label style={labelStyle}>Full name</label>
              <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="e.g. Ayesha Khan" style={inputStyle} />

              <label style={labelStyle}>Email (optional — for alerts &amp; password reset)</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={inputStyle} />
            </>
          )}

          <label style={labelStyle}>{role === "student" ? "Student ID" : "Username"}</label>
          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder={role === "student" ? "e.g. ST0003 (from course roster)" : (isRegister ? "Choose a username" : "Your username")}
            style={inputStyle}
          />
          {role === "student" && (
            <div style={{ fontSize: 11.5, color: "#9AA7C2", marginTop: -8, marginBottom: 12, lineHeight: 1.45 }}>
              Must match the Student ID provided in your institutional records.
            </div>
          )}

          <label style={labelStyle}>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={isRegister ? "Choose a password" : "••••••••"} style={inputStyle} />
          {!isRegister && (
            <button type="button" onClick={() => { setMode("forgot"); setError(""); setNotice(""); }} className="ep-btn" style={{
              background: "none", border: "none", color: "#9AA7C2", fontSize: 11.5, cursor: "pointer", padding: "6px 0", textDecoration: "underline",
            }}>
              Forgot password?
            </button>
          )}

          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#F4A79E", fontSize: 12, marginBottom: 10, marginTop: 10 }}>
              <AlertTriangle size={13} style={{ flexShrink: 0 }} /> {error}
            </div>
          )}
          {notice && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#8FCBA0", fontSize: 12, marginBottom: 10, marginTop: 10 }}>
              <ShieldCheck size={13} style={{ flexShrink: 0 }} /> {notice}
            </div>
          )}

          <button type="submit" disabled={submitting} className="ep-btn ep-btn-primary" style={{
            width: "100%", marginTop: 8, padding: "11px 0", background: COLORS.brass, color: "#16233F",
            border: "none", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif",
          }}>
            {submitting ? (isRegister ? "Creating account…" : "Signing in…") : (isRegister ? "Create account" : "Sign in")}
          </button>

          {!isRegister && (
            <button type="button" onClick={() => { setMode("forgot"); setError(""); setNotice(""); }} className="ep-btn"
              style={{ display: "block", margin: "10px auto 0", background: "none", border: "none", color: "#9AA7C2", fontSize: 12, cursor: "pointer" }}>
              Forgot password?
            </button>
          )}

          {!isRegister && (
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${COLORS.inkSoft}` }}>
              <div style={{ fontSize: 10.5, letterSpacing: "0.06em", textTransform: "uppercase", color: "#7280A0", marginBottom: 8 }}>Quick demo access</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[
                  ["admin1", "admin123", "Admin"],
                  ["teacher1", "teacher123", "Teacher"],
                  ["analyst1", "analyst123", "Analyst"],
                  ["STU1000", "student123", "Student"],
                ].map(([u, p, label]) => (
                  <button type="button" key={u} onClick={() => fillDemo(u, p)} className="ep-btn"
                    style={{ fontSize: 11, padding: "4px 9px", background: "transparent", border: `1px solid ${COLORS.inkSoft}`, color: "#9AA7C2", cursor: "pointer" }}>
                    {label}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 10.5, color: "#5E6C8C", marginTop: 8, lineHeight: 1.5 }}>
                These fill in real seeded accounts — your role always comes
                from your actual account, not from a button.
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
const labelStyle = { display: "block", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "#7280A0", marginBottom: 6, marginTop: 14 };
const inputStyle = { width: "100%", padding: "9px 10px", background: "#16233F", border: `1px solid ${COLORS.inkSoft}`, borderRadius: 3, color: "#F4F1E9", fontSize: 14, fontFamily: "'IBM Plex Mono', monospace", boxSizing: "border-box" };

/* ---------------- Top navigation bar ---------------- */
function TopBar({ user, onLogout, isDark, onToggleTheme, lang, onToggleLang, t, onOpenSettings }) {
  const [displayName, setDisplayName] = useState(user?.full_name || user?.username || "");

  useEffect(() => {
    if (!user?.role || user.role !== "student") {
      setDisplayName(user?.full_name || user?.username || "");
      return;
    }

    setDisplayName(user?.full_name || user?.username || "");
    apiGet(`/students/${user.username}`).then((record) => {
      setDisplayName(record?.full_name || user?.full_name || user?.username || "");
    }).catch(() => {
      setDisplayName(user?.full_name || user?.username || "");
    });
  }, [user?.role, user?.username, user?.full_name]);

  return (
    <div className="ep-topbar" style={{
      padding: "16px 28px", background: COLORS.ink, color: "#F4F1E9",
      borderBottom: `3px solid ${COLORS.brass}`,
    }}>
      <div className="ep-topbar-left">
        <div className="ep-logo-mark">E</div>
        <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 20 }}>EduPredict</span>
        <span style={{ fontSize: 11, color: "#9AA7C2", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {t ? t(`${user.role}_view`) : `${user.role} view`}
        </span>
      </div>
      <div className="ep-topbar-right">
        <span className="ep-topbar-username" style={{ fontSize: 13, color: "#C9D0E0" }}>{displayName}</span>
        {onOpenSettings && (
          <button onClick={onOpenSettings} className="ep-btn ep-topbar-username" style={{
            background: "none", border: `1px solid ${COLORS.inkSoft}`, color: "#C9D0E0", padding: "6px 10px",
            fontSize: 12, cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif",
          }}>
            Settings
          </button>
        )}
        {onToggleLang && (
          <button onClick={onToggleLang} className="ep-btn" style={{
            background: "none", border: `1px solid ${COLORS.inkSoft}`, color: "#C9D0E0", padding: "6px 10px",
            fontSize: 12, cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif",
          }}>
            {lang === "en" ? "اردو" : "EN"}
          </button>
        )}
        {onToggleTheme && (
          <button onClick={onToggleTheme} className="ep-btn" style={{
            background: "none", border: `1px solid ${COLORS.inkSoft}`, color: "#C9D0E0", padding: "6px 10px",
            fontSize: 12, cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif",
          }}>
            {isDark ? "☀ Light" : "☾ Dark"}
          </button>
        )}
        <button onClick={onLogout} className="ep-btn" style={{
          display: "flex", alignItems: "center", gap: 6, background: "none",
          border: `1px solid ${COLORS.inkSoft}`, color: "#C9D0E0", padding: "6px 10px",
          fontSize: 12, cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif",
        }}>
          <LogOut size={13} /> {t ? t("signOut") : "Sign out"}
        </button>
      </div>
    </div>
  );
}

/* ---------------- Real-time alert stream (SSE) ---------------- */
function useLiveAlerts(enabled) {
  const [liveAlert, setLiveAlert] = useState(null);
  useEffect(() => {
    if (!enabled) return;
    let es;
    try {
      es = new EventSource(`${API_BASE}/alerts/stream`, { withCredentials: true });
      es.onmessage = (e) => {
        try { setLiveAlert(JSON.parse(e.data)); } catch { }
      };
      es.onerror = () => es.close();
    } catch { }
    return () => es && es.close();
  }, [enabled]);
  return liveAlert;
}

function LiveAlertBanner({ alert, onDismiss }) {
  if (!alert) return null;
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8,
      background: "#3A1418", borderBottom: `2px solid ${COLORS.risk}`, color: "#F4CFC9",
      padding: "8px 16px", fontSize: 12.5,
    }}>
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <AlertTriangle size={13} style={{ flexShrink: 0 }} /> Live: {alert.message}
      </span>
      <button onClick={onDismiss} className="ep-btn" style={{ background: "none", border: "none", color: "#F4CFC9", cursor: "pointer", fontSize: 12 }}>dismiss</button>
    </div>
  );
}

/* ---------------- Feedback & support widget ---------------- */
function FeedbackWidget({ user }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("feedback");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!message.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      await apiPost("/feedback", { category, message });
      setSent(true);
      setMessage("");
      setTimeout(() => { setSent(false); setOpen(false); }, 1500);
    } catch (e) {
      setError(e.message || "Couldn't send feedback. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 50 }}>
      {open && (
        <div className="ep-feedback-panel" style={{ width: 280, maxWidth: "calc(100vw - 40px)", background: COLORS.cardBg, border: `1px solid ${COLORS.line}`, borderRadius: 6, boxShadow: "0 12px 32px rgba(22,35,63,0.18)", padding: 16, marginBottom: 10 }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 14, marginBottom: 10 }}>Feedback & Support</div>
          <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: "100%", padding: 6, marginBottom: 8, fontSize: 12.5, border: `1px solid ${COLORS.line}`, fontFamily: "'IBM Plex Sans', sans-serif" }}>
            <option value="feedback">General feedback</option>
            <option value="bug">Report an issue</option>
            <option value="question">Ask for help</option>
          </select>
          <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Tell us what's up…"
            style={{ width: "100%", height: 70, padding: 6, fontSize: 12.5, border: `1px solid ${COLORS.line}`, boxSizing: "border-box", fontFamily: "'IBM Plex Sans', sans-serif", resize: "none" }} />
          {error && <div style={{ fontSize: 11, color: COLORS.risk, marginTop: 6 }}>{error}</div>}
          <button onClick={submit} disabled={submitting} className="ep-btn" style={{ width: "100%", marginTop: 8, padding: "8px 0", background: COLORS.brass, border: "none", color: "#16233F", fontWeight: 600, fontSize: 12.5, cursor: "pointer" }}>
            {sent ? "Sent ✓" : submitting ? "Sending…" : "Submit"}
          </button>
        </div>
      )}
      <button onClick={() => setOpen(o => !o)} className="ep-btn" style={{
        width: 44, height: 44, borderRadius: "50%", background: COLORS.ink, color: "#F4F1E9",
        border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
      }}>
        <Bell size={18} />
      </button>
    </div>
  );
}

/* ---------------- Role router — sends each user to their dashboard ---------------- */
function RoleView({ role, user }) {
  if (role === "admin") return <AdminView />;
  if (role === "teacher") return <TeacherView />;
  if (role === "student") return <StudentView user={user} />;
  if (role === "analyst") return <AnalystView />;
  return null;
}

/* ---------------- Small shared UI building blocks ---------------- */
function SectionLabel({ children, icon: Icon }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
      {Icon && <Icon size={15} color={COLORS.brass} />}
      <span style={{ fontFamily: "'Fraunces', serif", fontSize: 17, fontWeight: 600, color: COLORS.ink }}>{children}</span>
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
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 26, fontWeight: 500, color: item.color || COLORS.ink }}>{animated}</div>
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
      <div className="ep-ledger-header" style={{ padding: "8px 4px", borderBottom: `1px solid ${COLORS.ink}`, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: COLORS.muted, minWidth: 420 }}>
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

/* ---------------- Admin dashboard ---------------- */
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
      {log.slice(0, 30).map((entry, i) => (
        <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: `1px solid ${COLORS.line}`, fontSize: 12, minWidth: 380 }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: COLORS.muted, flexShrink: 0 }}>
            {entry.created_at ? new Date(entry.created_at).toLocaleString() : "—"}
          </span>
          <span style={{ color: COLORS.brass, flexShrink: 0 }}>{entry.actor_username} ({entry.actor_role})</span>
          <span>{entry.action}{entry.target ? ` → ${entry.target}` : ""}</span>
        </div>
      ))}
    </div>
  );
}

function AdminView() {
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

/* ---------------- Teacher dashboard ---------------- */
function TeacherView() {
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
            <div className="ep-roster-header" style={{ padding: "8px 4px", borderBottom: `1px solid ${COLORS.ink}`, fontSize: 11, textTransform: "uppercase", color: COLORS.muted, minWidth: 340 }}>
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

/* ---------------- Career predictors (Field / University / CGPA) ---------------- */
function FieldPredictor() {
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
        <span style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 600, color: COLORS.ink }}>
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
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 600, color: COLORS.ink }}>
              {result.recommended_field.label}
            </div>
            <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 4 }}>
              Confidence: {(result.recommended_field.confidence * 100).toFixed(0)}%
            </div>
          </div>
          <div style={{ borderLeft: `3px solid ${COLORS.brass}`, paddingLeft: 14 }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", color: COLORS.muted, marginBottom: 4 }}>Likely college tier</div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 600, color: COLORS.ink }}>
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

function UniversityPredictor() {
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
        <span style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 600, color: COLORS.ink }}>
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
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 600, color: COLORS.ink }}>
              {result.suggested_program.label}
            </div>
            <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 4 }}>
              Confidence: {(result.suggested_program.confidence * 100).toFixed(0)}%
            </div>
          </div>
          <div style={{ borderLeft: `3px solid ${COLORS.brass}`, paddingLeft: 14 }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", color: COLORS.muted, marginBottom: 4 }}>Likely university tier</div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 600, color: COLORS.ink }}>
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

function CgpaPredictor() {
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
        <span style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 600, color: COLORS.ink }}>
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
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 24, fontWeight: 500, color: COLORS.ink }}>
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

function PredictorSuite() {
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
        <span style={{ fontFamily: "'Fraunces', serif", fontSize: 17, fontWeight: 600, color: COLORS.ink }}>
          Academic &amp; Career Predictors
        </span>
      </div>
      <div className="ep-tabs" style={{ marginBottom: 16, borderBottom: `1px solid ${COLORS.line}` }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className="ep-btn ep-tab-btn" data-active={tab === t.id} style={{
            padding: "8px 16px", background: "none", border: "none", cursor: "pointer",
            fontSize: 12.5, fontWeight: 600, fontFamily: "'IBM Plex Sans', sans-serif",
            color: tab === t.id ? COLORS.ink : COLORS.muted,
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

/* ---------------- Student dashboard ---------------- */
/* ---------------- Student goals + achievement badges ---------------- */
function GoalsAndBadges({ studentId, record }) {
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
        <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 15, marginBottom: 10, color: COLORS.ink }}>My Goal</div>
        {goal ? (
          <div>
            <div style={{ fontSize: 12.5, color: COLORS.muted, marginBottom: 4 }}>{goalLabels[goal.goal_type]}</div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 20, color: COLORS.ink }}>
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
        <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 15, marginBottom: 10, color: COLORS.ink }}>Achievements</div>
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

function StudentView({ user }) {
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

/* ---------------- Analyst dashboard ---------------- */
/* ---------------- Cohort comparison tool ---------------- */
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
        <button onClick={compare} disabled={loading} className="ep-btn ep-btn-primary" style={{ padding: "7px 16px", background: COLORS.brass, border: "none", color: "#16233F", fontWeight: 600, fontSize: 12.5, cursor: "pointer" }}>
          {loading ? "Comparing…" : "Compare"}
        </button>
      </div>
      {result && (
        <div className="ep-scroll-x">
          <table style={{ borderCollapse: "collapse", fontSize: 12.5, minWidth: 360 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${COLORS.ink}` }}>
                <th style={{ textAlign: "left", padding: "6px 12px 6px 0", color: COLORS.muted, fontWeight: 500 }}></th>
                <th style={{ textAlign: "left", padding: "6px 12px", color: COLORS.ink }}>Group A</th>
                <th style={{ textAlign: "left", padding: "6px 12px", color: COLORS.ink }}>Group B</th>
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

function AnalystView() {
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
