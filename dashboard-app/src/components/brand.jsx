import { cn } from "@/lib/utils";

/**
 * Brand mark: a filled lime square with a cut corner and a notch drawn
 * from the "graduation step" motif. Pure SVG so it stays crisp at any
 * size and inherits the current color tokens.
 */
export function LogoMark({ className }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={cn("size-7 shrink-0", className)}
    >
      <rect width="32" height="32" rx="9" fill="var(--primary)" />
      <path
        d="M9 21.5V10.5h12"
        stroke="var(--primary-foreground)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M9 16h7.5"
        stroke="var(--primary-foreground)"
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.55"
      />
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
