import { cn } from "@/lib/utils";

export function PageHeader({ eyebrow, title, description, actions, className }) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow ? (
          <div className="mb-1.5 text-[0.6875rem] font-medium tracking-[0.14em] text-muted-foreground uppercase">
            {eyebrow}
          </div>
        ) : null}
        <h1 className="text-[1.375rem] font-semibold tracking-tight text-balance sm:text-[1.5rem]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-[0.8125rem] leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function SectionHeader({ title, description, actions, className }) {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <div className="min-w-0">
        <h2 className="text-[0.875rem] font-semibold tracking-tight">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-[0.75rem] text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
