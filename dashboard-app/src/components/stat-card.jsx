import * as React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

/**
 * KPI tile. Deliberately restrained: one number, one label, one piece of
 * context. Color is used only for semantics (risk/safe), never decoration.
 */
export function StatCard({ label, value, hint, tone = "neutral", icon: Icon, trend }) {
  const toneClass =
    tone === "risk"
      ? "text-risk"
      : tone === "safe"
        ? "text-safe"
        : tone === "accent"
          ? "text-primary"
          : "text-foreground";

  return (
    <Card className="relative gap-0 overflow-hidden p-0">
      <div className="flex items-start justify-between px-4 pt-4">
        <span className="text-[0.6875rem] font-medium tracking-[0.09em] text-muted-foreground uppercase">
          {label}
        </span>
        {Icon ? <Icon className="size-3.5 text-muted-foreground/70" /> : null}
      </div>
      <div className="px-4 pt-2 pb-4">
        <div className={cn("font-mono text-[1.6rem] leading-none font-medium tracking-tight tnum", toneClass)}>
          {value}
        </div>
        <div className="mt-2 flex min-h-4 items-center gap-1.5">
          {trend ? <TrendPill {...trend} /> : null}
          {hint ? <span className="truncate text-[0.6875rem] text-muted-foreground">{hint}</span> : null}
        </div>
      </div>
    </Card>
  );
}

function TrendPill({ direction = "flat", label }) {
  const config = {
    up: { Icon: ArrowUpRight, cls: "text-safe bg-safe-soft" },
    down: { Icon: ArrowDownRight, cls: "text-risk bg-risk-soft" },
    flat: { Icon: Minus, cls: "text-muted-foreground bg-muted" },
  }[direction];
  const { Icon, cls } = config;
  return (
    <span className={cn("inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[0.625rem] font-medium", cls)}>
      <Icon className="size-2.5" />
      {label}
    </span>
  );
}

export function StatGrid({ children, className }) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 lg:grid-cols-4", className)}>
      {children}
    </div>
  );
}
