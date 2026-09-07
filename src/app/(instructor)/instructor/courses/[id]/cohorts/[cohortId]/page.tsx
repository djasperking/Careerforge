import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { requireOwnedCohort, seatsLeft } from "@/lib/cohort/service";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { attendanceByCohort } from "@/lib/cohort/service";
import { CohortForm } from "../cohort-form";
import { StatusControls, SessionManager, IssueCertificatesButton } from "./cohort-controls";
import { AttendanceSheet, NotifyWaitlistButton } from "./attendance";

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

  const [roster, waitlist, attendance, certCount] = await Promise.all([
    db.cohortEnrollment.findMany({
      where: { cohortId },
      orderBy: { createdAt: "asc" },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    db.cohortWaitlist.findMany({
      where: { cohortId },
      orderBy: { createdAt: "asc" },
      include: { user: { select: { name: true, email: true } } },
    }),
    attendanceByCohort(cohortId),
    db.certificate.count({ where: { cohortId } }),
  ]);
  const left = seatsLeft(cohort);
  const rosterMembers = roster.map((r) => ({ userId: r.user.id, name: r.user.name ?? r.user.email }));

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
              minAttendancePercent: String(cohort.minAttendancePercent),
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

      {cohort.sessions.length > 0 ? (
        <Card>
          <CardHeader><CardTitle>Attendance</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {cohort.sessions.map((s) => (
              <AttendanceSheet
                key={s.id}
                sessionId={s.id}
                title={s.title}
                when={new Date(s.startsAt).toLocaleString()}
                roster={rosterMembers}
                present={[...(attendance.get(s.id) ?? [])]}
              />
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader><CardTitle>Certificates</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            {cohort.minAttendancePercent > 0
              ? `Learners marked present for at least ${cohort.minAttendancePercent}% of live sessions are certified.`
              : "Every learner on the roster is certified."}{" "}
            Certificates are issued automatically when the class is marked completed.
          </p>
          <p>
            {certCount} certificate{certCount === 1 ? "" : "s"} issued
            {cohort.certificatesIssuedAt ? ` · last run ${formatDate(cohort.certificatesIssuedAt)}` : ""}
          </p>
          {cohort.status === "COMPLETED" ? (
            <IssueCertificatesButton cohortId={cohort.id} />
          ) : (
            <p className="text-xs text-muted-foreground">Mark the class completed to issue certificates.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Waitlist ({waitlist.length})</CardTitle>
          <NotifyWaitlistButton cohortId={cohort.id} count={waitlist.filter((w) => !w.notifiedAt).length} />
        </CardHeader>
        <CardContent>
          {waitlist.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No one is waiting.</p>
          ) : (
            <ul className="divide-y text-sm">
              {waitlist.map((w) => (
                <li key={w.id} className="flex items-center justify-between py-2">
                  <span>{w.user.name ?? w.user.email}</span>
                  <span className="text-xs text-muted-foreground">
                    {w.notifiedAt ? `notified ${formatDate(w.notifiedAt)}` : `waiting since ${formatDate(w.createdAt)}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
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
