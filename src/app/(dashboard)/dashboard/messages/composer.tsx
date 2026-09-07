"use client";

import { useRef, useState } from "react";
import { Loader2, Paperclip, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export type Attachment = { url: string; name: string; type: string };

export function Composer({
  onSend,
  placeholder = "Write a message…",
  autoFocus = false,
}: {
  onSend: (body: string, attachment?: Attachment) => Promise<{ ok: boolean; error?: string }>;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const [body, setBody] = useState("");
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", "message-attachment");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Upload failed.");
      setAttachment({ url: json.data.url, name: file.name, type: file.type });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() && !attachment) return;
    setSending(true);
    setError(null);
    const res = await onSend(body, attachment ?? undefined);
    setSending(false);
    if (res.ok) {
      setBody("");
      setAttachment(null);
      if (fileRef.current) fileRef.current.value = "";
    } else {
      setError(res.error ?? "Could not send.");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      {attachment ? (
        <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-1.5 text-sm">
          <Paperclip className="size-3.5" />
          <span className="truncate">{attachment.name}</span>
          <button type="button" onClick={() => setAttachment(null)} className="ml-auto text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>
      ) : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="grid size-10 shrink-0 place-items-center rounded-md border text-muted-foreground hover:bg-muted"
          aria-label="Attach a file"
        >
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <Paperclip className="size-4" />}
        </button>
        <input
          ref={fileRef}
          type="file"
          hidden
          accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
        />
        <textarea
          rows={1}
          autoFocus={autoFocus}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit(e as unknown as React.FormEvent);
            }
          }}
          placeholder={placeholder}
          className="max-h-40 min-h-10 flex-1 resize-y rounded-md border border-input bg-card px-3 py-2 text-sm"
        />
        <Button type="submit" size="icon" disabled={sending || uploading || (!body.trim() && !attachment)}>
          {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        </Button>
      </div>
    </form>
  );
}
