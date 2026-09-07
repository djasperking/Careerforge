"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { reviewAssignmentAction } from "@/app/(admin)/admin/courses/actions";

export function SubmissionRow({
  courseId,
  submission,
}: {
  courseId: string;
  submission: {
    id: string;
    learner: string;
    text: string;
    fileUrl: string | null;
    fileName: string | null;
    status: string;
    feedback: string | null;
    submittedAt: string;
  };
}) {
  const router = useRouter();
  const [feedback, setFeedback] = useState(submission.feedback ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(status: "SUBMITTED" | "REVIEWED") {
    setBusy(true);
    setError(null);
    const res = await reviewAssignmentAction(submission.id, courseId, { feedback, status });
    setBusy(false);
    if (res.ok) router.refresh();
    else setError(res.error);
  }

  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{submission.learner}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{submission.submittedAt}</span>
          <Badge variant={submission.status === "REVIEWED" ? "success" : "warning"}>
            {submission.status === "REVIEWED" ? "Reviewed" : "Awaiting review"}
          </Badge>
        </div>
      </div>

      <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{submission.text}</p>

      {submission.fileUrl ? (
        <a
          href={submission.fileUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <FileText className="size-4" /> {submission.fileName ?? "Attachment"}
        </a>
      ) : null}

      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        rows={2}
        placeholder="Feedback for the learner (optional)"
        className="mt-3 flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
      />
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
      <div className="mt-2 flex gap-2">
        <Button size="sm" disabled={busy} onClick={() => save("REVIEWED")}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : null} Mark reviewed
        </Button>
        {submission.status === "REVIEWED" ? (
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => save("SUBMITTED")}>
            Reopen
          </Button>
        ) : feedback ? (
          <Button size="sm" variant="outline" disabled={busy} onClick={() => save("SUBMITTED")}>
            Save feedback only
          </Button>
        ) : null}
      </div>
    </div>
  );
}
