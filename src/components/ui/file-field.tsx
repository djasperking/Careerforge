"use client";

import { useRef, useState } from "react";
import { Loader2, Paperclip, FileCheck2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Uploads a single file to POST /api/upload and reports its URL + name + size. */
export function FileField({
  value,
  fileName,
  onChange,
  kind = "digital-product",
  accept = ".pdf,.zip,.epub",
  disabled,
}: {
  value: string;
  fileName?: string;
  onChange: (v: { url: string; name: string; size: number }) => void;
  kind?: string;
  accept?: string;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("kind", kind);
      const res = await fetch("/api/upload", { method: "POST", body });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json?.error?.message ?? "Upload failed.");
      onChange({ url: json.data.url, name: file.name, size: json.data.size });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      {value ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileCheck2 className="size-4 text-success" />
          {fileName || "File attached"}
        </p>
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? <Loader2 className="size-4 animate-spin" /> : <Paperclip className="size-4" />}
        {value ? "Replace file" : "Upload file"}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = "";
        }}
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
