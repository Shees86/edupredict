import React from "react";
import { AlertTriangle, ShieldOff, Lock, SearchX, Ban, ServerCrash, Clock } from "lucide-react";
import { COLORS, BRAND_NAVY } from "./shared";

// One entry per status code this app can actually produce. Anything
// not listed falls back to the generic entry at the bottom.
const ERROR_CONTENT = {
  400: {
    icon: AlertTriangle,
    title: "That request wasn't valid",
    message: "Something about what was sent doesn't look right. Double-check the form and try again.",
  },
  401: {
    icon: Lock,
    title: "Please sign in",
    message: "Your session has ended or you're not logged in. Sign in again to continue.",
  },
  403: {
    icon: ShieldOff,
    title: "You don't have access to this",
    message: "Your account role doesn't have permission to view this page.",
  },
  404: {
    icon: SearchX,
    title: "Page not found",
    message: "We couldn't find what you were looking for. It may have moved, or the link might be out of date.",
  },
  405: {
    icon: Ban,
    title: "That action isn't supported",
    message: "This looks like a bug rather than something you did — please let an admin know.",
  },
  500: {
    icon: ServerCrash,
    title: "Something went wrong",
    message: "An unexpected error occurred on our end. Trying again usually fixes it.",
  },
  503: {
    icon: Clock,
    title: "Just a moment",
    message: "The server is starting up or briefly busy — this can take up to a minute on the free tier. Please try again shortly.",
  },
};
const GENERIC = { icon: AlertTriangle, title: "Something went wrong", message: "An unexpected error occurred. Please try again." };

export function ErrorScreen({ code, detail, onRetry, onHome }) {
  const content = ERROR_CONTENT[code] || GENERIC;
  const Icon = content.icon;
  return (
    <div style={{
      fontFamily: "'IBM Plex Sans', sans-serif", minHeight: "100vh", background: COLORS.paper, color: COLORS.text,
      display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px",
    }}>
      <div className="ep-card" style={{ maxWidth: 440, width: "100%", padding: "40px 32px", textAlign: "center" }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%", background: `${BRAND_NAVY}14`, color: BRAND_NAVY,
          display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px",
        }}>
          <Icon size={26} />
        </div>
        {code && (
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, letterSpacing: "0.08em", color: COLORS.muted, marginBottom: 8 }}>
            ERROR {code}
          </div>
        )}
        <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 24, margin: "0 0 10px" }}>
          {content.title}
        </h1>
        <p style={{ fontSize: 14.5, color: COLORS.muted, lineHeight: 1.6, margin: "0 0 8px" }}>
          {content.message}
        </p>
        {detail && (
          <p style={{ fontSize: 12.5, color: COLORS.muted, lineHeight: 1.5, margin: "0 0 24px", opacity: 0.75 }}>
            {detail}
          </p>
        )}
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 24 }}>
          {onRetry && (
            <button onClick={onRetry} className="ep-btn" style={{
              padding: "10px 22px", background: COLORS.brass, border: "none", color: "#FFFFFF", borderRadius: 3,
              fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif",
            }}>
              Try again
            </button>
          )}
          {onHome && (
            <button onClick={onHome} className="ep-btn" style={{
              padding: "10px 22px", background: "none", border: `1px solid ${COLORS.line}`, color: COLORS.text, borderRadius: 3,
              fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif",
            }}>
              Back to home
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Catches render-time crashes anywhere below it in the tree and shows
// a friendly recoverable screen instead of a blank white page. This
// only catches React rendering errors (a component throwing while
// rendering) — it does NOT catch errors inside event handlers or
// async code, which is why API calls still need their own try/catch.
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("EduPredict crashed:", error, info?.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <ErrorScreen
          code={500}
          detail={this.state.error?.message}
          onRetry={() => window.location.reload()}
          onHome={() => { window.location.href = "/"; }}
        />
      );
    }
    return this.props.children;
  }
}
