import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Circle, PlayCircle, ClipboardCheck, CalendarDays, Video } from "lucide-react";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatDate } from "@/lib/utils";

export default async function EnrolledCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const enrollment = await db.enrollment.findFirst({
    where: { userId: user.id, courseId: id },
    include: {
      course: {
        include: {
          modules: { include: { lessons: { orderBy: { position: "asc" } } }, orderBy: { position: "asc" } },
          exams: { where: { status: "PUBLISHED" } },
        },
      },
    },
  });
  if (!enrollment) notFound();

  const lessonIds = enrollment.course.modules.flatMap((m) => m.lessons.map((l) => l.id));
  const progressRows = lessonIds.length
    ? await db.courseProgress.findMany({ where: { userId: user.id, lessonId: { in: lessonIds } } })
    : [];
  const progressByLesson = new Map(progressRows.map((p) => [p.lessonId, p]));

  const nextLesson = enrollment.course.modules
    .flatMap((m) => m.lessons)
    .find((l) => !progressByLesson.get(l.id)?.completed);

  const cohortEnrolment = await db.cohortEnrollment.findFirst({
    where: { userId: user.id, cohort: { courseId: id } },
    include: { cohort: { include: { sessions: { orderBy: { startsAt: "asc" } } } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title={enrollment.course.title}
        description={`${enrollment.progressPercent}% complete · ${enrollment.status}`}
        action={
          <div className="flex gap-2">
            {nextLesson ? (
              <Button asChild>
                <Link href={`/dashboard/courses/${id}/lessons/${nextLesson.id}`}>
                  {progressByLesson.size === 0 ? "Start course" : "Continue"}
                </Link>
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link href="/dashboard/courses">Back</Link>
            </Button>
          </div>
        }
      />

      <div className="space-y-4">
        {cohortEnrolment ? (
          <Card className="border-primary/40 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="size-5" /> {cohortEnrolment.cohort.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                {formatDate(cohortEnrolment.cohort.startDate)} – {formatDate(cohortEnrolment.cohort.endDate)}
              </p>
              {cohortEnrolment.cohort.scheduleNote ? <p>{cohortEnrolment.cohort.scheduleNote}</p> : null}
              {cohortEnrolment.cohort.meetingUrl ? (
                <Button asChild size="sm">
                  <a href={cohortEnrolment.cohort.meetingUrl} target="_blank" rel="noreferrer">
                    <Video className="size-4" /> Join the class meeting
                  </a>
                </Button>
              ) : null}
              {cohortEnrolment.cohort.sessions.length > 0 ? (
                <div>
                  <p className="mb-1 font-medium">Sessions</p>
                  <ul className="space-y-1">
                    {cohortEnrolment.cohort.sessions.map((s) => (
                      <li key={s.id} className="flex flex-wrap items-center gap-x-2">
                        <span>{new Date(s.startsAt).toLocaleString()}</span>
                        <span className="text-muted-foreground">· {s.title} ({s.durationMinutes}m)</span>
                        {s.meetingUrl ? (
                          <a href={s.meetingUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">link</a>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        {enrollment.course.modules.map((m) => (
          <Card key={m.id}>
            <CardContent className="p-5">
              <p className="font-medium">{m.title}</p>
              <ul className="mt-2 space-y-1">
                {m.lessons.map((l) => {
                  const done = progressByLesson.get(l.id)?.completed ?? false;
                  return (
                    <li key={l.id}>
                      <Link
                        href={`/dashboard/courses/${id}/lessons/${l.id}`}
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                      >
                        {done ? (
                          <CheckCircle2 className="size-4 shrink-0 text-success" />
                        ) : (
                          <Circle className="size-4 shrink-0 text-muted-foreground" />
                        )}
                        <span className={cn(done && "text-muted-foreground line-through")}>{l.title}</span>
                        <span className="text-xs text-muted-foreground">({l.type})</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        ))}

        {enrollment.course.exams.length > 0 ? (
          <Card>
            <CardHeader><CardTitle>Exams</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {enrollment.course.exams.map((e) => (
                <Link
                  key={e.id}
                  href={`/dashboard/exams/${e.id}`}
                  className="flex items-center gap-2 rounded-md border p-3 text-sm hover:bg-muted"
                >
                  <ClipboardCheck className="size-4 text-primary" />
                  {e.title}
                  <Badge variant="secondary" className="ml-auto">{e.timeLimitMinutes} min</Badge>
                </Link>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {enrollment.status === "COMPLETED" ? (
          <Card className="border-success/40 bg-success/5">
            <CardContent className="flex items-center gap-3 p-5">
              <PlayCircle className="size-5 text-success" />
              <div>
                <p className="font-medium">Course completed</p>
                <p className="text-sm text-muted-foreground">Check your certificates page for your certificate.</p>
              </div>
              <Button asChild size="sm" className="ml-auto">
                <Link href="/dashboard/certificates">View certificates</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
