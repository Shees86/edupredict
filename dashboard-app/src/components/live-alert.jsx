import * as React from "react";
import { Radio, X } from "lucide-react";

export function LiveAlertBanner({ alert, onDismiss }) {
  if (!alert) return null;
  return (
    <div className="flex items-start gap-3 rounded-lg border border-risk/30 bg-risk-soft/60 px-3.5 py-2.5 animate-fade">
      <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-risk/15">
        <Radio className="size-3 text-risk" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[0.6875rem] font-medium tracking-[0.1em] text-risk uppercase">
          Live alert
        </div>
        <p className="mt-0.5 text-[0.8125rem] leading-relaxed text-foreground">{alert.message}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/35 focus-visible:outline-none"
        aria-label="Dismiss alert"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

export function useLiveAlerts(enabled) {
  const [alert, setAlert] = React.useState(null);

  React.useEffect(() => {
    if (!enabled || typeof window === "undefined") return undefined;
    let source;
    try {
      source = new EventSource(`${import.meta.env.VITE_API_BASE || "http://localhost:5000/api"}/alerts/stream`, {
        withCredentials: true,
      });
      source.onmessage = (event) => {
        try {
          setAlert(JSON.parse(event.data));
        } catch {
          /* ignore malformed frames */
        }
      };
      source.onerror = () => source.close();
    } catch {
      /* EventSource unsupported — alerts simply don't stream */
    }
    return () => source && source.close();
  }, [enabled]);

  return alert;
}
