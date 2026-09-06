"use client";

import { useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Image picker that accepts either a file upload or a pasted URL.
 * Uploads go to POST /api/upload and the resulting URL is reported via onChange.
 */
export function ImageField({
  value,
  onChange,
  kind = "course-thumbnail",
  disabled,
}: {
  value: string;
  onChange: (url: string) => void;
  kind?: string;
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
      onChange(json.data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative w-fit">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-28 w-auto rounded-md border object-cover" />
          {!disabled ? (
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full border bg-card text-muted-foreground hover:text-foreground"
              aria-label="Remove image"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          {value ? "Replace" : "Upload image"}
        </Button>
        <span className="text-xs text-muted-foreground">or paste a URL</span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = "";
        }}
      />

      <Input
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://…"
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
