import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { requireApprovedInstructor, requireOwnedCourse } from "@/lib/instructor/service";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CohortForm } from "./cohort-form";

export const metadata = { title: "Classes" };

const BADGE: Record<string, { label: string; variant: "secondary" | "warning" | "success" | "destructive" }> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  OPEN: { label: "Open", variant: "success" },
  RUNNING: { label: "Running", variant: "warning" },
  COMPLETED: { label: "Completed", variant: "secondary" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
};

export default async function CohortsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  try {
    await requireApprovedInstructor(user.id);
    await requireOwnedCourse(user.id, id);
  } catch {
    redirect("/instructor/courses");
  }

  const course = await requireOwnedCourse(user.id, id);
  const cohorts = await db.cohort.findMany({
    where: { courseId: id },
    orderBy: { startDate: "desc" },
    include: { _count: { select: { enrollments: true } } },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Classes — ${course.title}`}
        description="Run this course as a scheduled cohort with a start date, capacity and live sessions. Self-paced enrolment still works alongside this."
      />
      <p className="text-sm">
        <Link href={`/instructor/courses/${id}`} className="text-primary hover:underline">← Back to course</Link>
      </p>

      <Card>
        <CardHeader><CardTitle>Your classes</CardTitle></CardHeader>
        <CardContent>
          {cohorts.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No classes yet.</p>
          ) : (
            <ul className="divide-y text-sm">
              {cohorts.map((c) => {
                const b = BADGE[c.status];
                return (
                  <li key={c.id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <Link href={`/instructor/courses/${id}/cohorts/${c.id}`} className="font-medium hover:underline">{c.title}</Link>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(c.startDate)} – {formatDate(c.endDate)} · {c._count.enrollments}
                        {c.capacity > 0 ? `/${c.capacity}` : ""} enrolled
                        {c.priceCents != null ? ` · ${formatCurrency(c.priceCents, c.currency)}` : ""}
                      </p>
                    </div>
                    <Badge variant={b.variant}>{b.label}</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>New class</CardTitle></CardHeader>
        <CardContent>
          <CohortForm courseId={id} />
        </CardContent>
      </Card>
    </div>
  );
}
