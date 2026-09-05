"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { setExamStatus, deleteExam } from "../actions";

const STATUS_VARIANT: Record<string, "success" | "secondary" | "warning"> = {
  PUBLISHED: "success", DRAFT: "secondary", UNPUBLISHED: "warning", ARCHIVED: "secondary",
};

export function ExamStatusControl({ examId, status }: { examId: string; status: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function setStatus(next: "DRAFT" | "PUBLISHED" | "UNPUBLISHED" | "ARCHIVED") {
    setError(null);
    start(async () => {
      const res = await setExamStatus(examId, next);
      if (!res.ok) setError(res.error);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>
        {pending ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : null}
        {status !== "PUBLISHED" ? (
          <Button size="sm" onClick={() => setStatus("PUBLISHED")} disabled={pending}>Publish</Button>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setStatus("UNPUBLISHED")} disabled={pending}>Unpublish</Button>
        )}
        {status !== "ARCHIVED" ? (
          <Button size="sm" variant="outline" onClick={() => setStatus("ARCHIVED")} disabled={pending}>Archive</Button>
        ) : null}
        <Button
          size="sm"
          variant="outline"
          className="text-destructive hover:text-destructive"
          disabled={pending}
          onClick={() => {
            if (!confirm("Delete this exam? Only possible if it has no attempts.")) return;
            start(async () => {
              const res = await deleteExam(examId);
              if (res.ok) router.push("/admin/exams");
              else setError(res.error);
            });
          }}
        >
          <Trash2 className="size-4" /> Delete
        </Button>
      </div>
      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
