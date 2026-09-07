"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Paperclip, CheckCircle2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export type AssignmentData = {
  brief: string | null;
  submission: {
    text: string;
    fileUrl: string | null;
    fileName: string | null;
    status: string;
    feedback: string | null;
  } | null;
};

export function AssignmentPanel({
  courseId,
  lessonId,
  data,
}: {
  courseId: string;
  lessonId: string;
  data: AssignmentData;
}) {
  const router = useRouter();
  const [text, setText] = useState(data.submission?.text ?? "");
  const [file, setFile] = useState<{ url: string; name: string } | null>(
    data.submission?.fileUrl ? { url: data.submission.fileUrl, name: data.submission.fileName ?? "attachment" } : null,
  );
  const [editing, setEditing] = useState(!data.submission);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(f: File) {
    setBusy(true);
    setError(null);
    const body = new FormData();
    body.append("file", f);
    body.append("kind", "assignment-file");
    const res = await fetch("/api/upload", { method: "POST", body });
    setBusy(false);
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      setError(json?.error?.message || "Upload failed.");
      return;
    }
    setFile({ url: json.data.url, name: f.name });
  }

  async function submit() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/courses/${courseId}/lessons/${lessonId}/assignment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, fileUrl: file?.url ?? "", fileName: file?.name ?? "" }),
    });
    setBusy(false);
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      setError(json?.error?.message || "Could not submit.");
      return;
    }
    setEditing(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {data.brief ? (
        <div className="prose prose-sm max-w-none whitespace-pre-wrap rounded-lg border bg-card p-4 text-sm">
          {data.brief}
        </div>
      ) : null}

      {data.submission && !editing ? (
        <div className="space-y-3 rounded-lg border bg-card p-4 text-sm">
          <p className="flex items-center gap-2 font-medium text-success">
            <CheckCircle2 className="size-4" />
            Submitted{data.submission.status === "REVIEWED" ? " · reviewed" : " · awaiting review"}
          </p>
          <p className="whitespace-pre-wrap text-muted-foreground">{data.submission.text}</p>
          {data.submission.fileUrl ? (
            <a
              href={data.submission.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-primary hover:underline"
            >
              <FileText className="size-4" /> {data.submission.fileName ?? "Attachment"}
            </a>
          ) : null}
          {data.submission.feedback ? (
            <div className="rounded-md border-l-2 border-primary bg-muted/40 p-3">
              <p className="text-xs font-medium text-muted-foreground">Instructor feedback</p>
              <p className="mt-1 whitespace-pre-wrap">{data.submission.feedback}</p>
            </div>
          ) : null}
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            Edit &amp; resubmit
          </Button>
        </div>
      ) : (
        <div className="space-y-3 rounded-lg border bg-card p-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            placeholder="Write your response…"
            className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
          />
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-muted">
              <Paperclip className="size-4" />
              {file ? "Change file" : "Attach a file (optional)"}
              <input
                type="file"
                accept="application/pdf,application/zip,image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void upload(f);
                  e.target.value = "";
                }}
              />
            </label>
            {file ? <span className="text-xs text-muted-foreground">{file.name}</span> : null}
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex gap-2">
            <Button size="sm" onClick={submit} disabled={busy || text.trim().length === 0}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              {data.submission ? "Resubmit" : "Submit assignment"}
            </Button>
            {data.submission ? (
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">Submitting marks this lesson complete. You can resubmit later.</p>
        </div>
      )}
    </div>
  );
}
