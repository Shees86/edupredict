import * as React from "react";
import { Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { exportToCsv } from "@/lib/api";
import { cn } from "@/lib/utils";

export function ExportButton({ data, filename, label = "Export CSV", className }) {
  return (
    <Button
      variant="outline"
      size="sm"
      className={className}
      disabled={!data || data.length === 0}
      onClick={() => exportToCsv(filename, data)}
    >
      <Download className="size-3.5" />
      {label}
    </Button>
  );
}

export function SearchField({ value, onChange, placeholder = "Search…", className }) {
  return (
    <div className={cn("relative w-full sm:max-w-xs", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 pl-8 text-[0.8125rem]"
        aria-label={placeholder}
      />
    </div>
  );
}
