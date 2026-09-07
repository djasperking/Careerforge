"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { setJobStatus, deleteJob } from "./actions";

export function JobStatusControls({ jobId, status }: { jobId: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(fn: () => Promise<{ ok: boolean; error?: string }>, after?: () => void) {
    setBusy(true);
    setError(null);
    const res = await fn();
    setBusy(false);
    if (!res.ok) setError(res.error ?? "Something went wrong.");
    else if (after) after();
    else router.refresh();
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {status !== "PUBLISHED" ? (
          <Button size="sm" disabled={busy} onClick={() => run(() => setJobStatus(jobId, "PUBLISHED"))}>Publish</Button>
        ) : null}
        {status === "PUBLISHED" ? (
          <Button size="sm" variant="outline" disabled={busy} onClick={() => run(() => setJobStatus(jobId, "CLOSED"))}>Close listing</Button>
        ) : null}
        {status === "CLOSED" ? (
          <Button size="sm" variant="outline" disabled={busy} onClick={() => run(() => setJobStatus(jobId, "DRAFT"))}>Back to draft</Button>
        ) : null}
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive hover:text-destructive"
          disabled={busy}
          onClick={() => {
            if (confirm("Delete this job permanently?")) run(() => deleteJob(jobId), () => router.push("/admin/jobs"));
          }}
        >
          Delete
        </Button>
      </div>
      {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
    </div>
  );
}
