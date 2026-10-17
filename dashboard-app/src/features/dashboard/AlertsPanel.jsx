import * as React from "react";
import { AlertTriangle, Bell } from "lucide-react";
import { listAlerts } from "@/lib/resources";
import { formatDateTime } from "@/lib/format";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SectionHeader } from "@/components/page-header";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/states";
import { ScrollArea } from "@/components/ui/scroll-area";

export function AlertsPanel({ limit = 6, className }) {
  const [state, setState] = React.useState({ status: "loading", alerts: [], error: null });

  const load = React.useCallback(() => {
    setState((s) => ({ ...s, status: "loading" }));
    listAlerts()
      .then((alerts) => setState({ status: "ready", alerts, error: null }))
      .catch((error) => setState({ status: "error", alerts: [], error: error.message }));
  }, []);

  React.useEffect(load, [load]);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <SectionHeader
          title="Active alerts"
          description="Unresolved high-risk flags from the model"
          actions={<Bell className="size-3.5 text-muted-foreground" />}
        />
      </CardHeader>
      <CardContent className="pt-0">
        {state.status === "loading" ? <LoadingBlock label="Loading alerts…" /> : null}
        {state.status === "error" ? <ErrorState message={state.error} onRetry={load} /> : null}
        {state.status === "ready" && state.alerts.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No active alerts"
            description="Every flagged student has been reviewed or resolved."
            className="py-8"
          />
        ) : null}
        {state.status === "ready" && state.alerts.length > 0 ? (
          <ScrollArea className="max-h-[17rem] pr-3">
            <ul className="divide-y divide-border/50">
              {state.alerts.slice(0, limit).map((alert, i) => (
                <li key={`${alert.student_id}-${alert.created_at}-${i}`} className="flex gap-2.5 py-2.5 first:pt-0">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-risk" />
                  <div className="min-w-0">
                    <p className="text-[0.8125rem] leading-snug">{alert.message}</p>
                    <p className="mt-0.5 font-mono text-[0.6875rem] text-muted-foreground">
                      {formatDateTime(alert.created_at)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        ) : null}
      </CardContent>
    </Card>
  );
}
