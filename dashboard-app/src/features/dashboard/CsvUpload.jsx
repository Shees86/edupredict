import * as React from "react";
import { FileText, Loader2, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import { apiPostFile } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * CSV/JSON ingestion. Kept as a compact drop zone rather than a full
 * card, because it's a utility action, not the page's headline.
 */
export function CsvUpload({ onUploaded, className }) {
  const [file, setFile] = React.useState(null);
  const [uploading, setUploading] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);
  const inputRef = React.useRef(null);

  async function upload(selected) {
    if (!selected) return;
    setUploading(true);
    try {
      const result = await apiPostFile("/data/ingest", selected);
      toast.success(
        `Ingested ${result.inserted} record(s)${result.skipped ? `, ${result.skipped} skipped` : ""}.`
      );
      if (result.errors?.length) {
        toast.warning(`${result.errors.length} row(s) failed — check your column names.`);
      }
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      onUploaded?.();
    } catch (err) {
      toast.error(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-dashed border-border bg-card/40 p-4 transition-colors sm:flex-row sm:items-center",
        dragging && "border-primary/60 bg-primary/5",
        className
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const dropped = e.dataTransfer.files?.[0];
        if (dropped) setFile(dropped);
      }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
          <UploadCloud className="size-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <div className="text-[0.8125rem] font-medium">Upload student records</div>
          {file ? (
            <div className="mt-1 flex min-w-0 items-center gap-1.5 text-[0.6875rem] text-muted-foreground">
              <FileText className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate" title={file.name}>{file.name}</span>
              <span className="shrink-0">· {formatFileSize(file.size)}</span>
            </div>
          ) : (
            <p className="truncate text-[0.6875rem] text-muted-foreground">
              CSV or JSON · requires <code className="font-mono">student_id</code> · existing rows are updated
            </p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.json"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="sr-only"
          id="student-file-input"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          Choose file
        </Button>
        {file ? (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              setFile(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            disabled={uploading}
            aria-label="Clear selected file"
            title="Clear selected file"
          >
            <X className="size-4" />
          </Button>
        ) : null}
        <Button
          size="sm"
          onClick={() => upload(file)}
          disabled={!file || uploading}
        >
          {uploading ? <Loader2 className="size-3.5 animate-spin" /> : null}
          {uploading ? "Uploading…" : "Upload"}
        </Button>
      </div>
    </div>
  );
}
