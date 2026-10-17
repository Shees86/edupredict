import * as React from "react";
import { AppShell, ROLE_NAV } from "@/components/app-shell";
import { SettingsDialog } from "@/components/settings-dialog";
import { FeedbackDock } from "@/components/feedback-dock";
import { LiveAlertBanner, useLiveAlerts } from "@/components/live-alert";
import { Toaster } from "@/components/ui/sonner";
import { AdminGovernance, AdminOverview, AdminRegister } from "@/features/dashboard/views/AdminView";
import { TeacherPredictors, TeacherRoster } from "@/features/dashboard/views/TeacherView";
import { StudentGoals, StudentOverview, StudentPredictors } from "@/features/dashboard/views/StudentView";
import { AnalystCohorts, AnalystModel, AnalystOverview } from "@/features/dashboard/views/AnalystView";
import { ErrorScreen } from "@/features/errors/ErrorScreen";

/**
 * Authenticated workspace. Section is plain state (not a router) because
 * the app has no URL structure for deep links, and keeping it local
 * means switching roles can never leave a stale section mounted.
 */
export function DashboardApp({ user, onLogout }) {
  const nav = ROLE_NAV[user.role] || [];
  const [section, setSection] = React.useState(nav[0]?.id || "overview");
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [dismissedAlert, setDismissedAlert] = React.useState(null);

  const liveAlert = useLiveAlerts(["admin", "teacher", "analyst"].includes(user.role));

  React.useEffect(() => {
    const openSettings = () => setSettingsOpen(true);
    window.addEventListener("ep:open-settings", openSettings);
    return () => window.removeEventListener("ep:open-settings", openSettings);
  }, []);

  React.useEffect(() => {
    setSection(ROLE_NAV[user.role]?.[0]?.id || "overview");
  }, [user.role]);

  const showAlert = liveAlert && liveAlert !== dismissedAlert;

  return (
    <>
      <AppShell
        user={user}
        section={section}
        onSectionChange={setSection}
        onLogout={onLogout}
        onOpenSettings={() => setSettingsOpen(true)}
        alertSlot={
          showAlert ? (
            <LiveAlertBanner alert={liveAlert} onDismiss={() => setDismissedAlert(liveAlert)} />
          ) : null
        }
      >
        <div key={section} className="animate-rise">
          <SectionView role={user.role} section={section} user={user} onNavigate={setSection} />
        </div>
      </AppShell>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <FeedbackDock />
      <Toaster />
    </>
  );
}

function SectionView({ role, section, user, onNavigate }) {
  if (role === "admin") {
    if (section === "students") return <AdminRegister />;
    if (section === "governance") return <AdminGovernance />;
    return <AdminOverview onNavigate={onNavigate} />;
  }
  if (role === "teacher") {
    if (section === "predictors") return <TeacherPredictors />;
    return <TeacherRoster />;
  }
  if (role === "student") {
    if (section === "predictors") return <StudentPredictors />;
    if (section === "goal") return <StudentGoals user={user} />;
    return <StudentOverview user={user} />;
  }
  if (role === "analyst") {
    if (section === "model") return <AnalystModel />;
    if (section === "cohorts") return <AnalystCohorts />;
    return <AnalystOverview onNavigate={onNavigate} />;
  }
  return <ErrorScreen code={403} detail={`Unrecognized role: "${role}"`} onHome={() => window.location.reload()} />;
}
