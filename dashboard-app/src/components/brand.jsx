import { cn } from "@/lib/utils";

/**
 * Brand mark: a lime tile carrying three ascending bars — the "signal"
 * rising out of the noise. SVG so it stays crisp at any size and reads
 * from the theme tokens rather than hard-coded paint.
 */
export function LogoMark({ className }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={cn("size-7 shrink-0", className)}
    >
      <rect width="32" height="32" rx="9" fill="var(--primary)" />
      <rect x="8" y="17" width="3.4" height="7" rx="1.2" fill="var(--primary-foreground)" opacity="0.55" />
      <rect x="14.3" y="13" width="3.4" height="11" rx="1.2" fill="var(--primary-foreground)" opacity="0.78" />
      <rect x="20.6" y="8" width="3.4" height="16" rx="1.2" fill="var(--primary-foreground)" />
    </svg>
  );
}

export function Wordmark({ className, sub }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <div className="leading-none">
        <div className="text-[0.95rem] font-semibold tracking-tight">
          Edu<span className="text-primary">Predict</span>
        </div>
        {sub ? (
          <div className="mt-1 text-[0.625rem] font-medium tracking-[0.14em] text-muted-foreground uppercase">
            {sub}
          </div>
        ) : null}
      </div>
    </div>
  );
}
