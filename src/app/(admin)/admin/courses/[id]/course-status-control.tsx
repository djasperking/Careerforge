"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { setCourseStatus, duplicateCourse, deleteCourse } from "../actions";

const STATUS_VARIANT: Record<string, "success" | "secondary" | "warning"> = {
  PUBLISHED: "success", DRAFT: "secondary", UNPUBLISHED: "warning", ARCHIVED: "secondary",
};

export function CourseStatusControl({ courseId, status }: { courseId: string; status: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function setStatus(next: "PUBLISHED" | "UNPUBLISHED" | "DRAFT" | "ARCHIVED") {
    start(async () => {
      await setCourseStatus(courseId, next);
      router.refresh();
    });
  }

  return (
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
        disabled={pending}
        onClick={() => start(async () => {
          const res = await duplicateCourse(courseId);
          if (res.ok) router.push(`/admin/courses/${res.data.id}`);
        })}
      >
        <Copy className="size-4" /> Duplicate
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="text-destructive hover:text-destructive"
        disabled={pending}
        onClick={() => {
          if (!confirm("Delete this course? Only possible if it has no enrollments.")) return;
          start(async () => {
            const res = await deleteCourse(courseId);
            if (res.ok) router.push("/admin/courses");
            else alert(res.error);
          });
        }}
      >
        <Trash2 className="size-4" /> Delete
      </Button>
    </div>
  );
}
