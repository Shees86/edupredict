import * as React from "react";
import {
  AlertTriangle,
  Ban,
  Clock,
  Lock,
  SearchX,
  ServerCrash,
  ShieldOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/brand";

const CONTENT = {
  400: {
    icon: AlertTriangle,
    title: "That request wasn't valid",
    message: "Something about what was sent doesn't look right. Double-check the form and try again.",
  },
  401: {
    icon: Lock,
    title: "Please sign in",
    message: "Your session has ended or you're not signed in. Sign in again to continue.",
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

const GENERIC = {
  icon: AlertTriangle,
  title: "Something went wrong",
  message: "An unexpected error occurred. Please try again.",
};

export function ErrorScreen({ code, detail, onRetry, onHome }) {
  const content = CONTENT[code] || GENERIC;
  const Icon = content.icon;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-12">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <LogoMark className="size-8" />
        </div>
        <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-full border border-border bg-card">
          <Icon className="size-5 text-muted-foreground" />
        </div>
        {code ? (
          <div className="mb-2 font-mono text-[0.6875rem] tracking-[0.12em] text-muted-foreground uppercase">
            Error {code}
          </div>
        ) : null}
        <h1 className="text-[1.375rem] font-semibold tracking-tight">{content.title}</h1>
        <p className="mt-2 text-[0.875rem] leading-relaxed text-muted-foreground">{content.message}</p>
        {detail ? (
          <p className="mt-2 font-mono text-[0.6875rem] leading-relaxed break-words text-muted-foreground/70">
            {detail}
          </p>
        ) : null}
        <div className="mt-6 flex justify-center gap-2">
          {onRetry ? (
            <Button onClick={onRetry}>Try again</Button>
          ) : null}
          {onHome ? (
            <Button variant="outline" onClick={onHome}>
              Back to home
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/**
 * Catches render-time crashes anywhere below it and shows a recoverable
 * screen instead of a blank page. Async and event-handler errors still
 * need their own handling, which every API call in this app has.
 */
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
          onHome={() => {
            window.location.href = "/";
          }}
        />
      );
    }
    return this.props.children;
  }
}
