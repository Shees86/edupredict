import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ShieldCheck, AlertTriangle, GraduationCap, LineChart as LineIcon,
  LogOut, BookOpen, Bell,
} from "lucide-react";
import Hero3D from "./Hero3D";
import {
  API_BASE, COLORS, BRAND_NAVY, _isDarkTheme, applyTheme, apiGet, apiPost, setAuthenticated, LoadingNote,
} from "./dashboard/shared";
import { AdminView } from "./dashboard/views/AdminView";
import { TeacherView } from "./dashboard/views/TeacherView";
import { StudentView } from "./dashboard/views/StudentView";
import { AnalystView } from "./dashboard/views/AnalystView";
import { ErrorScreen } from "./dashboard/ErrorScreen";

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');`;

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

  .ep-btn { transition: background 0.15s ease, border-color 0.15s ease, opacity 0.15s ease, transform 0.1s ease; border-radius: 6px; }
  .ep-btn:hover:not(:disabled) { opacity: 0.85; transform: translateY(-1px); }
  .ep-btn:active:not(:disabled) { transform: translateY(0px); }
  .ep-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .ep-btn:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible {
    outline: 2px solid ${COLORS.brass}; outline-offset: 1px;
  }

  .ep-row-hover { transition: background 0.15s ease; }
  .ep-row-hover:hover { background: rgba(0,0,0,0.05); }

  .ep-card {
    background: ${COLORS.cardBg}; border: 1px solid ${COLORS.line}; border-radius: 28px;
    transition: transform 0.2s ease;
  }

  /* --- DESIGN.md system: flat, monochrome, condensed uppercase
     display type. Rather than rewrite every one of the many inline
     fontFamily declarations across the app, these attribute-selector
     rules retarget them centrally: any element whose inline style
     mentions the old font names picks up the new ones instead
     (an !important stylesheet rule is one of the few things that can
     override an inline style, which is what makes this work). */
  [style*="Fraunces"] {
    font-family: 'Barlow Condensed', ui-sans-serif, system-ui, sans-serif !important;
    text-transform: uppercase;
    letter-spacing: 0.01em;
  }
  [style*="IBM Plex Sans"] {
    font-family: 'Inter', ui-sans-serif, system-ui, sans-serif !important;
  }
  .ep-card-hover:hover { transform: translateY(-2px); }

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
    position: relative; overflow: hidden; min-height: 100vh; background: radial-gradient(ellipse 900px 500px at 50% -10%, #2A2A2A 0%, #171717 55%, #000000 100%);
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

export default function EduPredictDashboard() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("landing"); // "landing" | "login" | "register"
  const [sessionExpired, setSessionExpired] = useState(false);
  const liveAlert = useLiveAlerts(!!user && ["admin", "teacher", "analyst"].includes(user?.role));
  const [dismissedAlert, setDismissedAlert] = useState(null);

  useEffect(() => { setAuthenticated(!!user); }, [user]);

  useEffect(() => {
    function onSessionExpired() {
      setUser(null);
      setSessionExpired(true);
      setView("login");
    }
    window.addEventListener("ep:session-expired", onSessionExpired);
    return () => window.removeEventListener("ep:session-expired", onSessionExpired);
  }, []);

  // Dark mode: COLORS is a mutated shared object (see applyTheme), so
  // toggling this tick just forces the whole tree to re-render and
  // re-read the fresh COLORS.xxx values — no per-component rewiring.
  const [isDark, setIsDark] = useState(_isDarkTheme);
  function toggleTheme() {
    const next = !isDark;
    applyTheme(next);
    setIsDark(next);
  }

  const [settingsOpen, setSettingsOpen] = useState(false);
  const t = (key) => TRANSLATIONS[key] || key;

  if (!user) {
    return (
      <>
        <style>{FONT_IMPORT}{getGlobalCss()}</style>
        <main>
          <AnimatePresence mode="wait">
            {view === "landing" ? (
              <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                <LandingPage onLogin={() => setView("login")} onSignup={() => setView("register")} isDark={isDark} onToggleTheme={toggleTheme} t={t} />
              </motion.div>
            ) : (
              <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                <LoginScreen onLogin={setUser} initialMode={view} onBack={() => setView("landing")} t={t} sessionExpired={sessionExpired} onDismissSessionExpired={() => setSessionExpired(false)} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </>
    );
  }

  const showBanner = liveAlert && liveAlert !== dismissedAlert;

  return (
    <>
      <style>{FONT_IMPORT}{getGlobalCss()}</style>
      <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", background: COLORS.paper, minHeight: "100vh", color: COLORS.text }}>
        <TopBar user={user} onLogout={() => { setUser(null); setView("landing"); }} isDark={isDark} onToggleTheme={toggleTheme} t={t} onOpenSettings={() => setSettingsOpen(true)} />
        {showBanner && <LiveAlertBanner alert={liveAlert} onDismiss={() => setDismissedAlert(liveAlert)} />}
        <motion.main key={user.role} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }} className="ep-shell">
          <RoleView role={user.role} user={user} />
        </motion.main>
        <FeedbackWidget user={user} />
        <AnimatePresence>
          {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
        </AnimatePresence>
      </div>
    </>
  );
}

const TRANSLATIONS = {
  login: "Log in", signup: "Sign up", signOut: "Sign out",
  admin_view: "admin view", teacher_view: "teacher view", student_view: "student view", analyst_view: "analyst view",
  system_overview: "System Overview", class_roster: "Class Roster", academic_standing: "My Academic Standing",
  model_analysis: "Model & Cohort Analysis", risk_distribution: "Risk Distribution", active_alerts: "Active Alerts",
  student_register: "Student Register (latest)", system_health: "System Health",
  hero_title: "Spot at-risk students before it's too late.",
  get_started: "Get Started", have_account: "I already have an account",
  eyebrow: "Academic Analytics Portal",
  hero_tagline: "EduPredict combines Hadoop-scale data processing with machine learning to predict dropout risk, recommend academic pathways, and give every stakeholder — admin, teacher, student, analyst — the view they need.",
  feature_dropout_title: "Dropout Risk Detection",
  feature_dropout_text: "Trained ML model flags at-risk students early from attendance, scores, and engagement.",
  feature_career_title: "Career Pathway Predictors",
  feature_career_text: "Matric/intermediate percentage tools recommend fields, colleges, universities, and CGPA trend.",
  feature_alerts_title: "Real-Time Alerts",
  feature_alerts_text: "Live, role-based notifications the moment a student is flagged — no page refresh needed.",
  feature_cohort_title: "Cohort Analytics",
  feature_cohort_text: "Correlation analysis and model metrics for institution-wide, data-driven decisions.",
  footer_stack: "Built on Hadoop/HDFS, PySpark, Flask, MongoDB, and React.",
};

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
          <span style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 600, color: COLORS.text }}>Settings</span>
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
            <button onClick={savePrefs} className="ep-btn ep-btn-primary" style={{ padding: "7px 16px", background: COLORS.brass, border: "none", color: "#FFFFFF", fontWeight: 600, fontSize: 12.5, cursor: "pointer" }}>
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
              <button onClick={confirmTotp} className="ep-btn ep-btn-primary" style={{ padding: "8px 16px", background: COLORS.brass, border: "none", color: "#FFFFFF", fontWeight: 600, fontSize: 12.5, cursor: "pointer" }}>
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

function LandingPage({ onLogin, onSignup, isDark, onToggleTheme, t }) {
  const reduceMotion = useReducedMotion();
  const tr = t || ((k) => k);
  const features = [
    { icon: AlertTriangle, title: tr("feature_dropout_title"), text: tr("feature_dropout_text") },
    { icon: GraduationCap, title: tr("feature_career_title"), text: tr("feature_career_text") },
    { icon: Bell, title: tr("feature_alerts_title"), text: tr("feature_alerts_text") },
    { icon: LineIcon, title: tr("feature_cohort_title"), text: tr("feature_cohort_text") },
  ];

  const fadeUp = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  };
  const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", background: COLORS.paper, minHeight: "100vh", color: COLORS.text, overflowX: "hidden" }}>
      {/* Nav */}
      <motion.div
        initial={reduceMotion ? false : { y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
          padding: "18px 32px", background: BRAND_NAVY, borderBottom: `3px solid ${COLORS.brass}`,
        }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="ep-logo-mark">E</div>
          <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 19, color: "#F5F5F5" }}>EduPredict</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {onToggleTheme && (
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onToggleTheme} style={{
              padding: "8px 12px", background: "none", border: `1px solid ${COLORS.inkSoft}`, color: "#F5F5F5",
              fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif", borderRadius: 3,
            }}>
              {isDark ? "☀" : "☾"}
            </motion.button>
          )}
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onLogin} style={{
            padding: "8px 16px", background: "none", border: `1px solid ${COLORS.inkSoft}`, color: "#F5F5F5",
            fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif", borderRadius: 3,
          }}>
            {tr("login")}
          </motion.button>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onSignup} style={{
            padding: "8px 16px", background: COLORS.brass, border: "none", color: "#FFFFFF",
            fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif", borderRadius: 3,
          }}>
            {tr("signup")}
          </motion.button>
        </div>
      </motion.div>

      {/* Hero — text + 3D visual */}
      <div className="ep-hero-split" style={{ maxWidth: 1120, margin: "0 auto", padding: "56px 32px 40px" }}>
        <motion.div variants={stagger} initial="hidden" animate="show" style={{ textAlign: "left" }}>
          <motion.div variants={fadeUp} style={{ fontFamily: "'Fraunces', serif", fontSize: 13, letterSpacing: "0.2em", color: COLORS.brassText, textTransform: "uppercase", marginBottom: 14 }}>
            {tr("eyebrow")}
          </motion.div>
          <motion.h1 variants={fadeUp} style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: "clamp(32px, 4.6vw, 54px)", color: COLORS.text, lineHeight: 1.12, margin: "0 0 20px" }}>
            {tr("hero_title")}
          </motion.h1>
          <motion.p variants={fadeUp} style={{ fontSize: 16, color: COLORS.muted, lineHeight: 1.65, margin: "0 0 32px", maxWidth: 480 }}>
            {tr("hero_tagline")}
          </motion.p>
          <motion.div variants={fadeUp} style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={onSignup} style={{
                padding: "13px 28px", background: COLORS.brass, border: "none", color: "#FFFFFF", borderRadius: 3,
                fontSize: 14.5, fontWeight: 600, cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif",
              }}>
              {tr("get_started")}
            </motion.button>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={onLogin} style={{
                padding: "13px 28px", background: "none", border: `1px solid ${COLORS.line}`, color: COLORS.text, borderRadius: 3,
                fontSize: 14.5, fontWeight: 600, cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif",
              }}>
              {tr("have_account")}
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
                <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 15.5, color: COLORS.text, marginBottom: 6 }}>
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
        {tr("footer_stack")}
      </div>
    </div>
  );
}

function LoginScreen({ onLogin, initialMode = "login", onBack, sessionExpired, onDismissSessionExpired }) {
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
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setNotice(data.message || "Reset link generated.");
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
      <div className="ep-login-shell" style={{ fontFamily: "'IBM Plex Sans', sans-serif", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
        <div className="ep-login-texture" />
        <div style={{ width: "100%", maxWidth: 380, position: "relative" }}>
          <div className="ep-login-hero" style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
              <div className="ep-logo-mark" style={{ width: 44, height: 44, fontSize: 20 }}>E</div>
            </div>
            <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 28, color: "#F5F5F5" }}>Two-Factor Code</div>
            <div style={{ fontSize: 13, color: "#9A9A9A", marginTop: 8 }}>Enter the 6-digit code from your authenticator app</div>
          </div>
          <form onSubmit={handleVerify2fa} className="ep-login-card" style={{ background: "#1A1A1A", border: `1px solid ${COLORS.inkSoft}`, borderRadius: 20, padding: 28 }}>
            <label style={labelStyle}>Authentication code</label>
            <input value={totpCode} onChange={e => setTotpCode(e.target.value)} placeholder="123456" style={inputStyle} autoFocus />
            {error && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#F4A79E", fontSize: 12, marginBottom: 10, marginTop: 10 }}>
                <AlertTriangle size={13} style={{ flexShrink: 0 }} /> {error}
              </div>
            )}
            <button type="submit" disabled={submitting} className="ep-btn ep-btn-primary" style={{
              width: "100%", marginTop: 8, padding: "11px 0", background: COLORS.brass, color: "#FFFFFF",
              border: "none", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif",
            }}>
              {submitting ? "Verifying…" : "Verify"}
            </button>
            <button type="button" onClick={() => { setNeeds2fa(false); setTotpCode(""); setError(""); }} className="ep-btn" style={{
              width: "100%", marginTop: 10, padding: "8px 0", background: "none", border: "none", color: "#9A9A9A", fontSize: 12, cursor: "pointer",
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
      <div className="ep-login-shell" style={{ fontFamily: "'IBM Plex Sans', sans-serif", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
        <div className="ep-login-texture" />
        <div style={{ width: "100%", maxWidth: 380, position: "relative" }}>
          <button onClick={() => { setMode("login"); setError(""); setNotice(""); }} className="ep-btn" style={{
            display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
            color: "#9A9A9A", fontSize: 12.5, cursor: "pointer", marginBottom: 18, fontFamily: "'IBM Plex Sans', sans-serif",
          }}>
            ← Back to sign in
          </button>
          <div className="ep-login-hero" style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 28, color: "#F5F5F5" }}>Reset Password</div>
          </div>
          {!resetToken && !devResetToken ? (
            <form onSubmit={handleForgotPassword} className="ep-login-card" style={{ background: "#1A1A1A", border: `1px solid ${COLORS.inkSoft}`, borderRadius: 20, padding: 28 }}>
              <label style={labelStyle}>Username</label>
              <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Your username" style={inputStyle} />
              {notice && <div style={{ color: "#8FCBA0", fontSize: 12, marginTop: 10 }}>{notice}</div>}
              {devResetToken && (
                <div style={{ fontSize: 11, color: "#9A9A9A", marginTop: 8, lineHeight: 1.5 }}>
                  No email is configured on this server, so here's your reset token directly (dev/demo mode only):
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", background: "#000000", padding: 8, marginTop: 6, wordBreak: "break-all" }}>{devResetToken}</div>
                  <button type="button" onClick={() => setResetToken(devResetToken)} className="ep-btn" style={{ marginTop: 8, background: "none", border: `1px solid ${COLORS.brass}`, color: COLORS.brass, padding: "6px 10px", fontSize: 12, cursor: "pointer" }}>
                    Use this token now
                  </button>
                </div>
              )}
              <button type="submit" disabled={submitting} className="ep-btn ep-btn-primary" style={{
                width: "100%", marginTop: 14, padding: "11px 0", background: COLORS.brass, color: "#FFFFFF",
                border: "none", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif",
              }}>
                {submitting ? "Sending…" : "Send reset link"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="ep-login-card" style={{ background: "#1A1A1A", border: `1px solid ${COLORS.inkSoft}`, borderRadius: 20, padding: 28 }}>
              <label style={labelStyle}>Reset token</label>
              <input value={resetToken} onChange={e => setResetToken(e.target.value)} placeholder="Paste your reset token" style={inputStyle} />
              <label style={labelStyle}>New password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Choose a new password" style={inputStyle} />
              {error && <div style={{ color: "#F4A79E", fontSize: 12, marginTop: 10 }}>{error}</div>}
              {notice && <div style={{ color: "#8FCBA0", fontSize: 12, marginTop: 10 }}>{notice}</div>}
              <button type="submit" disabled={submitting} className="ep-btn ep-btn-primary" style={{
                width: "100%", marginTop: 14, padding: "11px 0", background: COLORS.brass, color: "#FFFFFF",
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
      <div className="ep-login-shell" style={{ fontFamily: "'IBM Plex Sans', sans-serif", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
        <div className="ep-login-texture" />
        <div style={{ width: "100%", maxWidth: 380, position: "relative" }}>
          <div className="ep-login-hero" style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
              <div className="ep-logo-mark" style={{ width: 44, height: 44, fontSize: 20 }}>E</div>
            </div>
            <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 26, color: "#F5F5F5" }}>Enter your 2FA code</div>
            <div style={{ fontSize: 13, color: "#9A9A9A", marginTop: 8 }}>Open your authenticator app and enter the 6-digit code.</div>
          </div>
          <form onSubmit={handleVerify2fa} className="ep-login-card" style={{ background: "#1A1A1A", border: `1px solid ${COLORS.inkSoft}`, borderRadius: 8, padding: 28 }}>
            <label style={labelStyle}>Authentication code</label>
            <input value={totpCode} onChange={e => setTotpCode(e.target.value)} placeholder="123456" style={inputStyle} autoFocus />
            {error && <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#F4A79E", fontSize: 12, marginTop: 10 }}><AlertTriangle size={13} /> {error}</div>}
            <button type="submit" disabled={submitting} className="ep-btn ep-btn-primary" style={{ width: "100%", marginTop: 16, padding: "11px 0", background: COLORS.brass, color: "#FFFFFF", border: "none", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
              {submitting ? "Verifying…" : "Verify & sign in"}
            </button>
            <button type="button" onClick={() => { setNeeds2fa(false); setTotpCode(""); setError(""); }} className="ep-btn" style={{ width: "100%", marginTop: 10, padding: "8px 0", background: "none", border: "none", color: "#9A9A9A", fontSize: 12.5, cursor: "pointer" }}>
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
      <div className="ep-login-shell" style={{ fontFamily: "'IBM Plex Sans', sans-serif", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
        <div className="ep-login-texture" />
        <div style={{ width: "100%", maxWidth: 380, position: "relative" }}>
          <button onClick={() => { setMode("login"); setError(""); setNotice(""); }} className="ep-btn" style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#9A9A9A", fontSize: 12.5, cursor: "pointer", marginBottom: 18 }}>
            ← Back to sign in
          </button>
          <div className="ep-login-hero" style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 26, color: "#F5F5F5" }}>Reset your password</div>
          </div>
          <form onSubmit={resetToken || devResetToken ? handleResetPassword : handleForgotPassword} className="ep-login-card" style={{ background: "#1A1A1A", border: `1px solid ${COLORS.inkSoft}`, borderRadius: 8, padding: 28 }}>
            {!devResetToken ? (
              <>
                <label style={labelStyle}>Username</label>
                <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Your username" style={inputStyle} />
              </>
            ) : (
              <>
                <div style={{ fontSize: 11.5, color: "#8FCBA0", marginBottom: 14, lineHeight: 1.5 }}>
                  No email is configured on this server, so here's your reset token directly (for demo/dev use):
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, background: "#000000", padding: "8px 10px", marginTop: 6, wordBreak: "break-all" }}>{devResetToken}</div>
                </div>
                <label style={labelStyle}>Reset token</label>
                <input value={resetToken} onChange={e => setResetToken(e.target.value)} placeholder="Paste token" style={inputStyle} />
                <label style={labelStyle}>New password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="New password" style={inputStyle} />
              </>
            )}
            {error && <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#F4A79E", fontSize: 12, marginTop: 10 }}><AlertTriangle size={13} /> {error}</div>}
            {notice && <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#8FCBA0", fontSize: 12, marginTop: 10 }}><ShieldCheck size={13} /> {notice}</div>}
            <button type="submit" disabled={submitting} className="ep-btn ep-btn-primary" style={{ width: "100%", marginTop: 16, padding: "11px 0", background: COLORS.brass, color: "#FFFFFF", border: "none", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
              {submitting ? "Please wait…" : (devResetToken || resetToken ? "Set new password" : "Send reset link")}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="ep-login-shell" style={{
      fontFamily: "'IBM Plex Sans', sans-serif", minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px",
    }}>
      <div className="ep-login-texture" />
      <div style={{ width: "100%", maxWidth: 380, position: "relative" }}>
        {onBack && (
          <button onClick={onBack} className="ep-btn" style={{
            display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
            color: "#9A9A9A", fontSize: 12.5, cursor: "pointer", marginBottom: 18, fontFamily: "'IBM Plex Sans', sans-serif",
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
          <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 36, color: "#F5F5F5", lineHeight: 1.1 }}>
            EduPredict
          </div>
          <div style={{ fontSize: 13, color: "#9A9A9A", marginTop: 8 }}>
            Dropout risk &amp; performance intelligence
          </div>
        </div>

        {sessionExpired && (
          <div style={{
            background: "rgba(226,163,50,0.12)", border: `1px solid ${COLORS.brass}`, borderRadius: 6,
            padding: "10px 14px", fontSize: 12.5, color: "#F0D9A8", marginBottom: 18, display: "flex",
            alignItems: "center", justifyContent: "space-between", gap: 10,
          }}>
            <span>Your session ended — please sign in again.</span>
            {onDismissSessionExpired && (
              <button onClick={onDismissSessionExpired} type="button" style={{
                background: "none", border: "none", color: "#F0D9A8", cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 0,
              }} aria-label="Dismiss">×</button>
            )}
          </div>
        )}
        <form onSubmit={isRegister ? handleRegister : handleLogin} className="ep-login-card" style={{ background: "#1A1A1A", border: `1px solid ${COLORS.inkSoft}`, borderRadius: 20, padding: 28 }}>

          <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#000000", borderRadius: 5, padding: 3 }}>
            {["login", "register"].map(m => (
              <button key={m} type="button" onClick={() => { setMode(m); setError(""); setNotice(""); }} className="ep-btn"
                style={{
                  flex: 1, padding: "7px 0", border: "none", borderRadius: 3, cursor: "pointer",
                  fontSize: 12.5, fontWeight: 600, fontFamily: "'IBM Plex Sans', sans-serif",
                  background: mode === m ? COLORS.brass : "transparent",
                  color: mode === m ? "#FFFFFF" : "#9A9A9A",
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
                        color: active ? COLORS.brass : "#9A9A9A",
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
            <div style={{ fontSize: 11.5, color: "#9A9A9A", marginTop: -8, marginBottom: 12, lineHeight: 1.45 }}>
              Must match the Student ID provided in your institutional records.
            </div>
          )}

          <label style={labelStyle}>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={isRegister ? "Choose a password" : "••••••••"} style={inputStyle} />
          {!isRegister && (
            <button type="button" onClick={() => { setMode("forgot"); setError(""); setNotice(""); }} className="ep-btn" style={{
              background: "none", border: "none", color: "#9A9A9A", fontSize: 11.5, cursor: "pointer", padding: "6px 0", textDecoration: "underline",
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
            width: "100%", marginTop: 8, padding: "11px 0", background: COLORS.brass, color: "#FFFFFF",
            border: "none", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif",
          }}>
            {submitting ? (isRegister ? "Creating account…" : "Signing in…") : (isRegister ? "Create account" : "Sign in")}
          </button>

          {!isRegister && (
            <button type="button" onClick={() => { setMode("forgot"); setError(""); setNotice(""); }} className="ep-btn"
              style={{ display: "block", margin: "10px auto 0", background: "none", border: "none", color: "#9A9A9A", fontSize: 12, cursor: "pointer" }}>
              Forgot password?
            </button>
          )}

        </form>
      </div>
    </div>
  );
}
const labelStyle = { display: "block", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "#7280A0", marginBottom: 6, marginTop: 14 };
const inputStyle = { width: "100%", padding: "9px 10px", background: "#000000", border: `1px solid ${COLORS.inkSoft}`, borderRadius: 3, color: "#F5F5F5", fontSize: 14, fontFamily: "'IBM Plex Mono', monospace", boxSizing: "border-box" };

function TopBar({ user, onLogout, isDark, onToggleTheme, t, onOpenSettings }) {
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
      padding: "16px 28px", background: BRAND_NAVY, color: "#F5F5F5",
      borderBottom: `3px solid ${COLORS.brass}`,
    }}>
      <div className="ep-topbar-left">
        <div className="ep-logo-mark">E</div>
        <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 20 }}>EduPredict</span>
        <span style={{ fontSize: 11, color: "#9A9A9A", letterSpacing: "0.08em", textTransform: "uppercase" }}>
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
        <div className="ep-feedback-panel" style={{ width: 280, maxWidth: "calc(100vw - 40px)", background: COLORS.cardBg, border: `1px solid ${COLORS.line}`, borderRadius: 20, padding: 16, marginBottom: 10 }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 14, marginBottom: 10 }}>Feedback & Support</div>
          <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: "100%", padding: 6, marginBottom: 8, fontSize: 12.5, border: `1px solid ${COLORS.line}`, fontFamily: "'IBM Plex Sans', sans-serif" }}>
            <option value="feedback">General feedback</option>
            <option value="bug">Report an issue</option>
            <option value="question">Ask for help</option>
          </select>
          <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Tell us what's up…"
            style={{ width: "100%", height: 70, padding: 6, fontSize: 12.5, border: `1px solid ${COLORS.line}`, boxSizing: "border-box", fontFamily: "'IBM Plex Sans', sans-serif", resize: "none" }} />
          {error && <div style={{ fontSize: 11, color: COLORS.risk, marginTop: 6 }}>{error}</div>}
          <button onClick={submit} disabled={submitting} className="ep-btn" style={{ width: "100%", marginTop: 8, padding: "8px 0", background: COLORS.brass, border: "none", color: "#FFFFFF", fontWeight: 600, fontSize: 12.5, cursor: "pointer" }}>
            {sent ? "Sent ✓" : submitting ? "Sending…" : "Submit"}
          </button>
        </div>
      )}
      <button onClick={() => setOpen(o => !o)} className="ep-btn" style={{
        width: 44, height: 44, borderRadius: "50%", background: BRAND_NAVY, color: "#F5F5F5",
        border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Bell size={18} />
      </button>
    </div>
  );
}

function RoleView({ role, user }) {
  if (role === "admin") return <AdminView />;
  if (role === "teacher") return <TeacherView />;
  if (role === "student") return <StudentView user={user} />;
  if (role === "analyst") return <AnalystView />;
  return <ErrorScreen code={403} detail={`Unrecognized role: "${role}"`} onHome={() => window.location.reload()} />;
}

