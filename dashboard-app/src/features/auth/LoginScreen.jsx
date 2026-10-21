import * as React from "react";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  KeyRound,
  LineChart,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { API_BASE } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { LogoMark } from "@/components/brand";
import { ThemeToggleButton } from "@/components/theme-toggle";

const ROLES = [
  { id: "teacher", label: "Teacher", icon: BookOpen, blurb: "Roster, predictions & class insight" },
  { id: "student", label: "Student", icon: GraduationCap, blurb: "Your standing, goals & pathways" },
  { id: "analyst", label: "Analyst", icon: LineChart, blurb: "Model metrics & cohort analysis" },
];

const MODE_COPY = {
  login: { title: "Welcome back", subtitle: "Sign in to your EduPredict workspace." },
  register: { title: "Create your account", subtitle: "Pick a role — an administrator approves staff and student accounts." },
  forgot: { title: "Reset your password", subtitle: "We'll send a reset link to the email on file for your account." },
  reset: { title: "Choose a new password", subtitle: "Paste the reset token from your email, then set a new password." },
};

export function AuthScreen({ initialMode = "login", onAuthenticated, onBack, sessionExpired, onDismissSessionExpired }) {
  const urlToken = React.useMemo(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("reset_token") || "";
  }, []);

  const [mode, setMode] = React.useState(() => (urlToken ? "reset" : initialMode));
  const [step, setStep] = React.useState("password"); // "password" | "2fa"
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState("");
  const [totpCode, setTotpCode] = React.useState("");
  const [resetToken, setResetToken] = React.useState(urlToken);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");
  const [notice, setNotice] = React.useState("");

  const isRegister = mode === "register";

  function switchMode(next) {
    setMode(next);
    setError("");
    setNotice("");
    setStep("password");
  }

  async function post(path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { res, data };
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const { res, data } = await post("/auth/login", { username, password });
      if (!res.ok) {
        setError(res.status === 401 ? "Incorrect username or password." : data.error || "Something went wrong signing in.");
        return;
      }
      if (data.needs_2fa) {
        setStep("2fa");
        return;
      }
      onAuthenticated(data.user);
    } catch {
      setError("Can't reach the API right now. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerify2fa(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const { res, data } = await post("/auth/login/verify-2fa", { code: totpCode });
      if (!res.ok) {
        setError(data.error || "Incorrect code.");
        return;
      }
      onAuthenticated(data.user);
    } catch {
      setError("Can't reach the API right now. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    if (!role) {
      setError("Select a role before creating your account.");
      return;
    }
    if (!username.trim() || !password.trim()) {
      setError("Username and password are required.");
      return;
    }
    setSubmitting(true);
    try {
      const { res, data } = await post("/auth/register", {
        username,
        password,
        role,
        full_name: fullName,
        email,
      });
      if (!res.ok) {
        setError(data.error || "Could not create account.");
        return;
      }
      setNotice(data.message || "Account created — you can sign in now.");
      switchMode("login");
      setNotice(data.message || "Account created — you can sign in now.");
      setPassword("");
    } catch {
      setError("Can't reach the API right now, so accounts can't be created. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleForgot(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    setSubmitting(true);
    try {
      const { res, data } = await post("/auth/forgot-password", { username });
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setNotice(data.message || "If an account exists for that username, a reset link has been sent.");
    } catch {
      setError("Can't reach the API right now.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReset(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    setSubmitting(true);
    try {
      const { res, data } = await post("/auth/reset-password", { token: resetToken, new_password: password });
      if (!res.ok) {
        setError(data.error || "Could not reset password.");
        return;
      }
      switchMode("login");
      setNotice("Password updated — sign in with your new password.");
      setPassword("");
    } catch {
      setError("Can't reach the API right now.");
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "2fa") {
    return (
      <AuthLayout onBack={onBack}>
        <AuthCard
          icon={KeyRound}
          title="Two-factor verification"
          subtitle="Enter the 6-digit code from your authenticator app."
        >
          <form onSubmit={handleVerify2fa} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="totp">Authentication code</Label>
              <Input
                id="totp"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                className="h-11 text-center font-mono text-lg tracking-[0.4em]"
              />
            </div>
            <FormMessage error={error} />
            <Button type="submit" className="w-full" disabled={submitting || totpCode.length < 6}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
              Verify &amp; sign in
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => {
                setStep("password");
                setTotpCode("");
                setError("");
              }}
            >
              <ArrowLeft className="size-3.5" />
              Back to sign in
            </Button>
          </form>
        </AuthCard>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout onBack={onBack}>
      <AuthCard
        icon={mode === "forgot" || mode === "reset" ? KeyRound : ShieldCheck}
        title={MODE_COPY[mode].title}
        subtitle={MODE_COPY[mode].subtitle}
      >
        {sessionExpired ? (
          <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-warn/30 bg-warn/10 px-3 py-2.5">
            <ShieldAlert className="mt-0.5 size-3.5 shrink-0 text-warn" />
            <p className="flex-1 text-[0.75rem] leading-relaxed text-foreground">
              Your session ended. Sign in again to continue.
            </p>
            {onDismissSessionExpired ? (
              <button
                type="button"
                onClick={onDismissSessionExpired}
                className="text-[0.75rem] text-muted-foreground hover:text-foreground"
              >
                Dismiss
              </button>
            ) : null}
          </div>
        ) : null}

        {(mode === "login" || isRegister) && (
          <>
            <div className="grid grid-cols-2 gap-1 rounded-lg border border-border/70 bg-muted/40 p-1">
              {[
                { id: "login", label: "Sign in" },
                { id: "register", label: "Create account" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => switchMode(tab.id)}
                  aria-pressed={mode === tab.id}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-[0.8125rem] font-medium transition-colors",
                    mode === tab.id
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <Separator className="my-5" />
          </>
        )}

        {isRegister ? (
          <form onSubmit={handleRegister} className="space-y-4">
            <fieldset className="space-y-2">
              <legend className="mb-1.5 text-[0.75rem] font-medium text-muted-foreground">Register as</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {ROLES.map((r) => {
                  const Icon = r.icon;
                  const active = role === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      aria-pressed={active}
                      className={cn(
                        "flex flex-col items-start gap-1.5 rounded-lg border p-2.5 text-left transition-colors",
                        active
                          ? "border-primary/60 bg-primary/10"
                          : "border-border/70 hover:border-border hover:bg-accent/40"
                      )}
                    >
                      <Icon className={cn("size-4", active ? "text-primary" : "text-muted-foreground")} />
                      <span className={cn("text-[0.8125rem] font-medium", active && "text-primary")}>
                        {r.label}
                      </span>
                      <span className="text-[0.6875rem] leading-snug text-muted-foreground">{r.blurb}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[0.6875rem] leading-relaxed text-muted-foreground">
                Administrator accounts can't be self-registered. Ask an existing admin to create one
                for you through the gated setup endpoint.
              </p>
            </fieldset>

            <div className="space-y-1.5">
              <Label htmlFor="full-name">Full name</Label>
              <Input
                id="full-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ayesha Khan"
                autoComplete="name"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">
                Email {role === "student" ? "" : "(optional)"}
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required={role === "student"}
                aria-describedby={role === "student" ? "email-hint" : undefined}
              />
              {role === "student" ? (
                <p id="email-hint" className="text-[0.6875rem] leading-relaxed text-muted-foreground">
                  Must match the email on file for your Student ID. It's used for alerts and password resets.
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reg-username">{role === "student" ? "Student ID" : "Username"}</Label>
              <Input
                id="reg-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={role === "student" ? "e.g. ST0003" : "Choose a username"}
                autoComplete="username"
              />
              {role === "student" ? (
                <p className="text-[0.6875rem] leading-relaxed text-muted-foreground">
                  Must match the Student ID in your institutional records.
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reg-password">Password</Label>
              <Input
                id="reg-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 10 characters"
                autoComplete="new-password"
                aria-describedby="password-policy-hint"
              />
              <p id="password-policy-hint" className="text-[0.6875rem] leading-relaxed text-muted-foreground">
                At least 10 characters, including at least one letter and one digit.
              </p>
            </div>

            <FormMessage error={error} notice={notice} />

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
              Create account
            </Button>
          </form>
        ) : mode === "forgot" ? (
          <form onSubmit={handleForgot} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="forgot-username">Username</Label>
              <Input
                id="forgot-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your username"
                autoComplete="username"
                autoFocus
              />
            </div>

            <FormMessage error={error} notice={notice} />

            <Button type="submit" className="w-full" disabled={submitting || !username.trim()}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
              Send reset link
            </Button>

            <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
              <div className="flex items-center gap-2 text-[0.75rem] font-medium">
                <Sparkles className="size-3.5 text-primary" />
                Have a token already?
              </div>
              <p className="mt-1 text-[0.6875rem] leading-relaxed text-muted-foreground">
                Reset links open this page with the token pre-filled. You can also paste one in
                manually.
              </p>
              <Button type="button" variant="outline" size="sm" className="mt-2.5" onClick={() => switchMode("reset")}>
                Enter a reset token
              </Button>
            </div>

            <Button type="button" variant="ghost" className="w-full text-muted-foreground" onClick={() => switchMode("login")}>
              <ArrowLeft className="size-3.5" />
              Back to sign in
            </Button>
          </form>
        ) : mode === "reset" ? (
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="reset-token">Reset token</Label>
              <Input
                id="reset-token"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                placeholder="Paste the token from your reset link"
                className="font-mono text-[0.75rem]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reset-password">New password</Label>
              <Input
                id="reset-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 10 characters"
                autoComplete="new-password"
                aria-describedby="password-policy-hint"
              />
              <p id="password-policy-hint" className="text-[0.6875rem] leading-relaxed text-muted-foreground">
                At least 10 characters, including at least one letter and one digit.
              </p>
            </div>

            <FormMessage error={error} notice={notice} />

            <Button type="submit" className="w-full" disabled={submitting || !resetToken || password.length < 10}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
              Set new password
            </Button>

            <Button type="button" variant="ghost" className="w-full text-muted-foreground" onClick={() => switchMode("login")}>
              <ArrowLeft className="size-3.5" />
              Back to sign in
            </Button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="login-username">Username or Student ID</Label>
              <Input
                id="login-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your username"
                autoComplete="username"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="login-password">Password</Label>
                <button
                  type="button"
                  onClick={() => switchMode("forgot")}
                  className="text-[0.75rem] text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <Input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <FormMessage error={error} notice={notice} />

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
              Sign in
            </Button>
          </form>
        )}
      </AuthCard>

      <p className="mt-5 text-center text-[0.75rem] text-muted-foreground">
        Protected by role-based access control and optional two-factor authentication.
      </p>
    </AuthLayout>
  );
}

function FormMessage({ error, notice }) {
  if (!error && !notice) return null;
  return (
    <div className="space-y-2">
      {error ? (
        <div className="flex items-start gap-2 rounded-lg border border-risk/30 bg-risk-soft/60 px-3 py-2.5">
          <ShieldAlert className="mt-0.5 size-3.5 shrink-0 text-risk" />
          <p className="text-[0.75rem] leading-relaxed text-foreground">{error}</p>
        </div>
      ) : null}
      {notice ? (
        <div className="flex items-start gap-2 rounded-lg border border-safe/30 bg-safe-soft/60 px-3 py-2.5">
          <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-safe" />
          <p className="text-[0.75rem] leading-relaxed text-foreground">{notice}</p>
        </div>
      ) : null}
    </div>
  );
}

function AuthCard({ icon: Icon, title, subtitle, children }) {
  return (
    <Card className="w-full gap-0 p-6 sm:p-7 animate-rise">
      <div className="mb-5">
        <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-primary/12">
          <Icon className="size-4 text-primary" />
        </div>
        <h1 className="text-[1.25rem] font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-[0.8125rem] leading-relaxed text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </Card>
  );
}

function AuthLayout({ children, onBack }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Brand rail — hidden below lg so the form owns small screens. */}
      <aside className="relative hidden overflow-hidden bg-sidebar lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.55]" />
        <div
          className="pointer-events-none absolute -top-32 -left-24 size-[28rem] rounded-full opacity-[0.16] blur-[90px]"
          style={{ background: "var(--primary)" }}
        />

        <div className="relative flex items-center gap-2.5">
          <LogoMark />
          <span className="text-[1rem] font-semibold tracking-tight">
            Edu<span className="text-primary">Predict</span>
          </span>
        </div>

        <div className="relative max-w-md">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/70 px-3 py-1 text-[0.6875rem] tracking-[0.12em] text-muted-foreground uppercase">
            <span className="size-1.5 rounded-full bg-primary" />
            Academic analytics portal
          </div>
          <h2 className="font-serif text-[2.75rem] leading-[1.05] tracking-tight text-balance">
            Spot at-risk students before it's too late.
          </h2>
          <p className="mt-4 text-[0.875rem] leading-relaxed text-muted-foreground">
            Hadoop-scale processing meets dropout-risk models, pathway predictors, and live
            cohort analytics — one workspace per role.
          </p>
        </div>

        <ul className="relative space-y-2.5">
          {[
            "Dropout risk scored from attendance, scores and LMS engagement",
            "Field, university and CGPA-trend predictors for every student",
            "Live alerts the moment a cohort crosses the line",
          ].map((line) => (
            <li key={line} className="flex items-start gap-2.5 text-[0.8125rem] text-muted-foreground">
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-primary" />
              {line}
            </li>
          ))}
        </ul>
      </aside>

      <main className="relative flex flex-col items-center justify-center px-5 py-10 sm:px-8">
        <div className="absolute top-5 right-5">
          <ThemeToggleButton />
        </div>
        <div className="w-full max-w-[26rem]">
          <div className="mb-6 flex items-center justify-between lg:hidden">
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-1.5 text-[0.8125rem] text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="size-3.5" />
                Home
              </button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
              <LogoMark className="size-6" />
              <span className="text-[0.875rem] font-semibold">
                Edu<span className="text-primary">Predict</span>
              </span>
            </div>
          </div>

          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="mb-4 hidden items-center gap-1.5 text-[0.8125rem] text-muted-foreground transition-colors hover:text-foreground lg:flex"
            >
              <ArrowLeft className="size-3.5" />
              Back to home
            </button>
          ) : null}

          {children}
        </div>
      </main>
    </div>
  );
}
