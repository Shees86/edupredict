import { Badge } from "@/components/ui/badge";
import { ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";

/**
 * Risk is the load-bearing semantic in this product, so it gets a single
 * consistent presentation everywhere: icon + word, never color alone.
 * Accepts the API's numeric flag (0/1) or the model's label string.
 */
export function RiskBadge({ risk, className }) {
  const isHigh = risk === 1 || risk === "1" || risk === "High Risk" || risk === "high";
  if (risk === undefined || risk === null || risk === "") {
    return (
      <Badge variant="outline" className={className}>
        <ShieldQuestion />
        Unknown
      </Badge>
    );
  }
  return isHigh ? (
    <Badge variant="risk" className={className}>
      <ShieldAlert />
      High risk
    </Badge>
  ) : (
    <Badge variant="safe" className={className}>
      <ShieldCheck />
      On track
    </Badge>
  );
}

export function ProbabilityMeter({ value, className }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  const tone = pct >= 60 ? "var(--risk)" : pct >= 35 ? "var(--warn)" : "var(--safe)";
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-[0.6875rem] tracking-wide text-muted-foreground uppercase">Dropout probability</span>
        <span className="font-mono text-[0.8125rem] tnum" style={{ color: tone }}>
          {pct}%
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%`, background: tone }}
        />
      </div>
    </div>
  );
}
