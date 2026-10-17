import * as React from "react";
import { AlertTriangle, Inbox, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function LoadingBlock({ label = "Loading…", className }) {
  return (
    <div className={cn("flex items-center gap-2 py-8 text-[0.8125rem] text-muted-foreground", className)}>
      <Loader2 className="size-3.5 animate-spin" />
      {label}
    </div>
  );
}

export function LoadingCards({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border/70 bg-card p-4">
          <Skeleton className="h-2.5 w-20" />
          <Skeleton className="mt-4 h-7 w-24" />
          <Skeleton className="mt-3 h-2.5 w-28" />
        </div>
      ))}
    </div>
  );
}

export function LoadingChart({ height = 240 }) {
  return (
    <div className="flex w-full items-end gap-2" style={{ height }}>
      {[38, 62, 48, 76, 56, 84, 44, 68].map((h, i) => (
        <Skeleton key={i} className="flex-1 rounded-sm" style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}

export function ErrorState({ message, onRetry, className }) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-3 rounded-xl border border-risk/25 bg-risk-soft/50 p-4 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-risk" />
        <p className="text-[0.8125rem] leading-relaxed text-foreground">{message}</p>
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry} className="shrink-0 border-risk/30 text-risk hover:bg-risk/10 hover:text-risk">
          <RefreshCw className="size-3.5" />
          Retry
        </Button>
      ) : null}
    </div>
  );
}

export function EmptyState({ title, description, icon: Icon = Inbox, action, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-12 text-center", className)}>
      <div className="mb-3 flex size-10 items-center justify-center rounded-full border border-border bg-muted/50">
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <p className="text-[0.875rem] font-medium">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-[0.75rem] leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
