import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Circle, PlayCircle, ClipboardCheck } from "lucide-react";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
