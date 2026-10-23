// EduPredict — © 2026 Muhammad Shees — All Rights Reserved
import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { apiGet, apiPost, setAuthenticated } from "@/lib/api";
import { ThemeProvider } from "@/lib/theme";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LandingPage } from "@/features/landing/LandingPage";
import { AuthScreen } from "@/features/auth/LoginScreen";
import { DashboardApp } from "@/features/dashboard/DashboardApp";

/*
 * Top-level state machine:
 *   landing → auth (login | register | forgot | reset) → dashboard
 * A 401 from an authenticated request drops the user back to auth with a
 * "session ended" notice; a 401 from the login form does not (api.js
 * distinguishes the two via setAuthenticated).
 */
export default function App() {
  const [user, setUser] = React.useState(null);
  const [isSessionLoading, setIsSessionLoading] = React.useState(true);
  const [sessionExpired, setSessionExpired] = React.useState(false);
  const [screen, setScreen] = React.useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("reset_token")) return "auth";
    }
    return "landing";
  });
  const [initialMode, setInitialMode] = React.useState("login");
  const reduceMotion = useReducedMotion();

  React.useEffect(() => {
    setAuthenticated(Boolean(user));
  }, [user]);

  React.useEffect(() => {
    let active = true;
    apiGet("/auth/me")
      .then(({ user: sessionUser }) => {
        if (active) setUser(sessionUser);
      })
      .catch((error) => {
        if (error.status !== 401) {
          console.error("Could not restore the session.", error);
        }
      })
      .finally(() => {
        if (active) {
          setIsSessionLoading(false);
          window.dispatchEvent(new Event("ep:initial-auth-settled"));
        }
      });
    window.dispatchEvent(new Event("ep:app-mounted"));

    return () => {
      active = false;
    };
  }, []);

  React.useEffect(() => {
    function onSessionExpired() {
      setUser(null);
      setSessionExpired(true);
      setScreen("auth");
      setInitialMode("login");
    }
    async function onSignOut() {
      try {
        await apiPost("/auth/logout");
        setUser(null);
        setScreen("landing");
      } catch (error) {
        toast.error(error.message || "Couldn't sign out. Try again.");
      }
    }
    window.addEventListener("ep:session-expired", onSessionExpired);
    window.addEventListener("ep:sign-out", onSignOut);
    return () => {
      window.removeEventListener("ep:session-expired", onSessionExpired);
      window.removeEventListener("ep:sign-out", onSignOut);
    };
  }, []);

  function openAuth(mode = "login") {
    setInitialMode(mode);
    setSessionExpired(false);
    setScreen("auth");
  }

  const transition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.22, ease: [0.22, 1, 0.36, 1] };

  return (
    <ThemeProvider>
      <TooltipProvider delayDuration={250}>
        <AnimatePresence mode="wait">
          {isSessionLoading ? null : user ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={transition}
            >
              <DashboardApp
                user={user}
                onLogout={() => window.dispatchEvent(new CustomEvent("ep:sign-out"))}
              />
            </motion.div>
          ) : screen === "auth" ? (
            <motion.div
              key="auth"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={transition}
            >
              <AuthScreen
                initialMode={initialMode}
                onAuthenticated={(nextUser) => {
                  setSessionExpired(false);
                  setUser(nextUser);
                }}
                onBack={() => setScreen("landing")}
                sessionExpired={sessionExpired}
                onDismissSessionExpired={() => setSessionExpired(false)}
              />
            </motion.div>
          ) : (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={transition}
            >
              <LandingPage
                onLogin={() => openAuth("login")}
                onSignup={() => openAuth("register")}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </TooltipProvider>
    </ThemeProvider>
  );
}
