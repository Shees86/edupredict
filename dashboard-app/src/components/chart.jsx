import * as React from "react";
import {
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SectionHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";

export const CHART_COLORS = {
  accent: "var(--chart-1)",
  safe: "var(--chart-2)",
  risk: "var(--chart-3)",
  blue: "var(--chart-4)",
  warn: "var(--chart-5)",
  grid: "var(--chart-grid)",
};

export const axisTick = {
  fontSize: 11,
  fill: "var(--muted-foreground)",
  fontFamily: "var(--font-mono)",
};

export const gridProps = {
  stroke: "var(--chart-grid)",
  strokeDasharray: "2 4",
  vertical: false,
};

export function ChartCard({ title, description, actions, children, className, contentClassName }) {
  return (
    <Card className={cn("gap-0 overflow-hidden", className)}>
      <CardHeader className="pb-4">
        <SectionHeader title={title} description={description} actions={actions} />
      </CardHeader>
      <CardContent className={cn("pt-0", contentClassName)}>{children}</CardContent>
    </Card>
  );
}

export function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-[0.75rem] shadow-xl">
      {label !== undefined && label !== null ? (
        <div className="mb-1 font-medium text-foreground">{label}</div>
      ) : null}
      <div className="space-y-0.5">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="size-1.5 rounded-full"
              style={{ background: entry.color || entry.fill || "var(--primary)" }}
            />
            <span className="text-muted-foreground">{entry.name}</span>
            <span className="ml-auto font-mono tnum text-foreground">
              {formatter ? formatter(entry.value, entry) : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChartFrame({ height = 240, children, className }) {
  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

export { Tooltip, CartesianGrid, XAxis, YAxis };
