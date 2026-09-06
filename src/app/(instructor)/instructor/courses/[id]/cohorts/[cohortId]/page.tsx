import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { requireOwnedCohort, seatsLeft } from "@/lib/cohort/service";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CohortForm } from "../cohort-form";
import { StatusControls, SessionManager } from "./cohort-controls";

export const metadata = { title: "Class" };

function toDateInput(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function CohortDetailPage({
  params,
}: {
  params: Promise<{ id: string; cohortId: string }>;
}) {
  const { id, cohortId } = await params;
  const user = await requireUser();

  let cohort;
  try {
    cohort = await requireOwnedCohort(user.id, cohortId);
  } catch {
    notFound();
  }
  if (cohort.courseId !== id) notFound();

  const roster = await db.cohortEnrollment.findMany({
    where: { cohortId },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { name: true, email: true } } },
  });
  const left = seatsLeft(cohort);

  return (
    <div className="space-y-6">
      <PageHeader title={cohort.title} description={cohort.course.title} />
      <p className="text-sm">
        <Link href={`/instructor/courses/${id}/cohorts`} className="text-primary hover:underline">← All classes</Link>
      </p>

      <Card>
        <CardHeader><CardTitle>Status</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Badge>{cohort.status}</Badge>
            <span className="text-muted-foreground">
              {roster.length}{cohort.capacity > 0 ? `/${cohort.capacity}` : ""} enrolled
              {left != null ? ` · ${left} seats left` : ""}
            </span>
            <span className="text-muted-foreground">
              {formatCurrency(cohort.priceCents ?? cohort.course.priceCents, cohort.currency)}
            </span>
          </div>
          <StatusControls cohortId={cohort.id} status={cohort.status} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Details</CardTitle></CardHeader>
        <CardContent>
          <CohortForm
            courseId={id}
            cohortId={cohort.id}
            initial={{
              title: cohort.title,
              startDate: toDateInput(cohort.startDate),
              endDate: toDateInput(cohort.endDate),
              enrollByDate: cohort.enrollByDate ? toDateInput(cohort.enrollByDate) : "",
              capacity: String(cohort.capacity),
              priceNaira: cohort.priceCents != null ? String(cohort.priceCents / 100) : "",
              meetingUrl: cohort.meetingUrl ?? "",
              scheduleNote: cohort.scheduleNote ?? "",
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Live sessions</CardTitle></CardHeader>
        <CardContent>
          <SessionManager
            cohortId={cohort.id}
            sessions={cohort.sessions.map((s) => ({
              id: s.id,
              title: s.title,
              startsAt: s.startsAt.toISOString(),
              durationMinutes: s.durationMinutes,
              meetingUrl: s.meetingUrl,
              note: s.note,
            }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Roster ({roster.length})</CardTitle></CardHeader>
        <CardContent>
          {roster.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No one has joined yet.</p>
          ) : (
            <ul className="divide-y text-sm">
              {roster.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-2">
                  <span>{r.user.name ?? r.user.email}</span>
                  <span className="text-xs text-muted-foreground">joined {formatDate(r.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
