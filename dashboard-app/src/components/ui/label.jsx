import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/utils";

const Label = React.forwardRef(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    data-slot="label"
    className={cn(
      "flex items-center gap-2 text-[0.75rem] font-medium tracking-wide text-muted-foreground select-none",
      "group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50",
      className
    )}
    {...props}
  />
));
Label.displayName = "Label";

export { Label };
