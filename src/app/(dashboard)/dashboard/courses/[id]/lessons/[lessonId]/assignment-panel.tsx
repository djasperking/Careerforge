"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Paperclip, CheckCircle2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { renderMarkdown } from "@/lib/markdown";
import { enhancePlaygrounds } from "@/components/lesson/playground";
import { CodeWorkspace } from "@/components/lesson/code-workspace";
import { SubmissionPreview } from "@/components/lesson/site-preview";
import { mergeWithStarter, parseSubmission, parseWorkspaceBrief } from "@/lib/course/workspace";

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
  const spec = useMemo(() => parseWorkspaceBrief(data.brief), [data.brief]);
  const briefRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (briefRef.current) enhancePlaygrounds(briefRef.current);
  }, [spec.brief]);
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

  async function submit(body?: string) {
    const payload = body ?? text;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/courses/${courseId}/lessons/${lessonId}/assignment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: payload, fileUrl: file?.url ?? "", fileName: file?.name ?? "" }),
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
      {spec.brief ? (
        <div
          ref={briefRef}
          className="cf-prose rounded-xl border bg-card p-5"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(spec.brief) }}
        />
      ) : null}

      {data.submission && !editing ? (
        <div className="space-y-3 rounded-lg border bg-card p-4 text-sm">
          <p className="flex items-center gap-2 font-medium text-success">
            <CheckCircle2 className="size-4" />
            Submitted{data.submission.status === "REVIEWED" ? " · reviewed" : " · awaiting review"}
          </p>
          {spec.enabled && parseSubmission(data.submission.text) ? (
            <SubmissionPreview text={data.submission.text} />
          ) : (
            <p className="whitespace-pre-wrap text-muted-foreground">{data.submission.text}</p>
          )}
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
      ) : spec.enabled ? (
        <CodeWorkspace
          starter={spec.files}
          initial={mergeWithStarter(parseSubmission(data.submission?.text), spec.files)}
          checks={spec.checks}
          storageKey={`cf-workspace:${lessonId}`}
          busy={busy}
          error={error}
          submitLabel={data.submission ? "Resubmit my website" : "Submit my website"}
          onSubmit={(t) => void submit(t)}
          onCancel={data.submission ? () => setEditing(false) : undefined}
        />
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
            <Button size="sm" onClick={() => void submit()} disabled={busy || text.trim().length === 0}>
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
