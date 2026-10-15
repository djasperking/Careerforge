import { notFound } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2, PlayCircle, ClipboardCheck, CalendarDays, Video, Lock, FileText, HelpCircle, PencilRuler,
  Clock, ChevronDown, ArrowLeft, Trophy,
} from "lucide-react";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { CourseThumb } from "@/components/ui/course-thumb";
import { ShareCourse } from "@/components/course/share-course";
import { appUrl } from "@/lib/email";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatDate } from "@/lib/utils";
import { getUserReview } from "@/lib/review/service";
import { CourseReviewForm } from "./review-form";

const LESSON_ICON: Record<string, React.ElementType> = {
  VIDEO: PlayCircle, TEXT: FileText, PDF: FileText, QUIZ: HelpCircle, ASSIGNMENT: PencilRuler, EXAM: ClipboardCheck,
};
const LESSON_LABEL: Record<string, string> = {
  VIDEO: "Video", TEXT: "Lesson", PDF: "PDF", QUIZ: "Quiz", ASSIGNMENT: "Assignment", EXAM: "Exam",
};

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

  const allLessons = enrollment.course.modules.flatMap((m) => m.lessons);
  const totalLessons = allLessons.length;
  const doneCount = allLessons.filter((l) => progressByLesson.get(l.id)?.completed).length;
  const percent = totalLessons ? Math.round((doneCount / totalLessons) * 100) : 0;
  // Lessons open in order; exam lessons are taken elsewhere so they never lock the ones after them.
  const firstOpenIdx = allLessons.findIndex((l) => l.type !== "EXAM" && !progressByLesson.get(l.id)?.completed);

  const myReview = await getUserReview(user.id, id);

  const cohortEnrolment = await db.cohortEnrollment.findFirst({
    where: { userId: user.id, cohort: { courseId: id } },
    include: { cohort: { include: { sessions: { orderBy: { startsAt: "asc" } } } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <Link href="/dashboard/courses" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> My courses
      </Link>

      <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="grid gap-0 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <CourseThumb src={enrollment.course.thumbnailUrl} alt={enrollment.course.title} className="h-full rounded-none border-0" />
          <div className="flex flex-col justify-center gap-4 p-5 sm:p-7">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                {enrollment.status === "COMPLETED" ? "Completed" : "Your course"}
              </p>
              <h1 className="mt-1 font-display text-2xl font-semibold leading-tight sm:text-3xl">{enrollment.course.title}</h1>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-medium">{doneCount} of {totalLessons} lessons done</span>
                <span className="font-semibold text-primary">{percent}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-fuchsia-500 transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>

            {nextLesson ? (
              <div className="flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <Link href={`/dashboard/courses/${id}/lessons/${nextLesson.id}`}>
                    <PlayCircle className="size-5" /> {doneCount === 0 ? "Start course" : "Continue learning"}
                  </Link>
                </Button>
                <p className="min-w-0 text-sm text-muted-foreground">
                  Up next: <span className="font-medium text-foreground">{nextLesson.title}</span>
                </p>
              </div>
            ) : (
              <p className="flex items-center gap-2 text-sm font-medium text-success">
                <Trophy className="size-5" /> You have finished every lesson. Well done!
              </p>
            )}

            <div className="border-t pt-4">
              <ShareCourse url={appUrl(`/courses/${enrollment.course.slug}`)} title={enrollment.course.title} free={enrollment.course.priceCents === 0} />
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6 space-y-4">
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

        <h2 className="font-display text-lg font-semibold">Course content</h2>
        {enrollment.course.modules.map((m, mi) => {
          const moduleDone = m.lessons.filter((l) => progressByLesson.get(l.id)?.completed).length;
          const complete = m.lessons.length > 0 && moduleDone === m.lessons.length;
          const hasNext = nextLesson ? m.lessons.some((l) => l.id === nextLesson.id) : false;
          return (
            <details key={m.id} open={hasNext || (!nextLesson && mi === 0)} className="group overflow-hidden rounded-xl border bg-card">
              <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
                <span
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold",
                    complete ? "bg-success/15 text-success" : "bg-primary/10 text-primary",
                  )}
                >
                  {complete ? <CheckCircle2 className="size-5" /> : mi + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{m.title}</span>
                  <span className="text-xs text-muted-foreground">{moduleDone} of {m.lessons.length} done</span>
                </span>
                <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <ul className="border-t">
                {m.lessons.map((l) => {
                  const done = progressByLesson.get(l.id)?.completed ?? false;
                  const idx = allLessons.findIndex((x) => x.id === l.id);
                  const locked = !done && firstOpenIdx !== -1 && idx > firstOpenIdx && l.type !== "EXAM";
                  const isNext = nextLesson?.id === l.id;
                  const Icon = LESSON_ICON[l.type] ?? FileText;
                  const mins = Math.max(1, Math.round(l.durationSeconds / 60));
                  const row = (
                    <>
                      <span className="grid size-6 shrink-0 place-items-center">
                        {done ? (
                          <CheckCircle2 className="size-5 text-success" />
                        ) : locked ? (
                          <Lock className="size-4 text-muted-foreground/60" />
                        ) : (
                          <span className={cn("size-4 rounded-full border-2", isNext ? "border-primary bg-primary/20" : "border-muted-foreground/40")} />
                        )}
                      </span>
                      <span className={cn("min-w-0 flex-1 truncate text-sm", done && "text-muted-foreground", isNext && "font-semibold")}>
                        {l.title}
                      </span>
                      <span className="hidden shrink-0 items-center gap-1 text-xs text-muted-foreground sm:inline-flex">
                        <Icon className="size-3.5" /> {LESSON_LABEL[l.type] ?? l.type}
                        {l.durationSeconds > 0 ? (
                          <>
                            <Clock className="ml-2 size-3.5" /> {mins} min
                          </>
                        ) : null}
                      </span>
                      {isNext ? <Badge className="shrink-0">Up next</Badge> : null}
                    </>
                  );
                  return (
                    <li key={l.id} className="border-b last:border-b-0">
                      {locked ? (
                        <div className="flex items-center gap-3 px-4 py-3 opacity-60" title="Finish the earlier lessons to unlock this one">
                          {row}
                        </div>
                      ) : (
                        <Link
                          href={`/dashboard/courses/${id}/lessons/${l.id}`}
                          className={cn("flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/60", isNext && "bg-primary/5")}
                        >
                          {row}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </details>
          );
        })}

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

        <Card>
          <CardHeader><CardTitle>{myReview ? "Your review" : "Rate this course"}</CardTitle></CardHeader>
          <CardContent>
            <CourseReviewForm
              courseId={id}
              initial={myReview ? { rating: myReview.rating, body: myReview.body ?? "" } : null}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
