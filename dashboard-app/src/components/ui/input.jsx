import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef(({ className, type, ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    data-slot="input"
    className={cn(
      "flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-[0.875rem] shadow-[0_1px_0_0_color-mix(in_oklch,var(--background)_60%,transparent)_inset] transition-[border-color,box-shadow] outline-none",
      "placeholder:text-muted-foreground/70",
      "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
      "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/25",
      "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
      "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";

export { Input };
