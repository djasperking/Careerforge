import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { assertCanEditCourse } from "@/lib/course/service";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { SubmissionRow } from "./submission-row";

export const metadata = { title: "Assignment submissions" };

export default async function CourseSubmissionsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id: courseId } = await params;

  try {
    await assertCanEditCourse(user, courseId, { allowLocked: true });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const course = await db.course.findUnique({
    where: { id: courseId },
    select: {
      title: true,
      modules: {
        orderBy: { position: "asc" },
        select: {
          lessons: {
            where: { type: "ASSIGNMENT" },
            orderBy: { position: "asc" },
            select: {
              id: true,
              title: true,
              assignmentSubmissions: {
                orderBy: { updatedAt: "desc" },
                include: { user: { select: { name: true, email: true } } },
              },
            },
          },
        },
      },
    },
  });
  if (!course) notFound();

  const assignmentLessons = course.modules.flatMap((m) => m.lessons);
  const pending = assignmentLessons.reduce(
    (n, l) => n + l.assignmentSubmissions.filter((s) => s.status === "SUBMITTED").length,
    0,
  );

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/instructor/courses/${courseId}`}><ArrowLeft className="size-4" /></Link>
        </Button>
        <PageHeader
          title="Assignment submissions"
          description={`${course.title} · ${pending} awaiting review`}
        />
      </div>

      {assignmentLessons.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            This course has no assignment lessons yet. Add a lesson of type &ldquo;Assignment&rdquo; from the course editor.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {assignmentLessons.map((lesson) => (
            <Card key={lesson.id}>
              <CardHeader>
                <CardTitle className="text-base">
                  {lesson.title}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    · {lesson.assignmentSubmissions.length} submission{lesson.assignmentSubmissions.length === 1 ? "" : "s"}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {lesson.assignmentSubmissions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No submissions yet.</p>
                ) : (
                  lesson.assignmentSubmissions.map((s) => (
                    <SubmissionRow
                      key={s.id}
                      courseId={courseId}
                      submission={{
                        id: s.id,
                        learner: s.user.name ?? s.user.email,
                        text: s.text,
                        fileUrl: s.fileUrl,
                        fileName: s.fileName,
                        status: s.status,
                        feedback: s.feedback,
                        submittedAt: formatDate(s.updatedAt),
                      }}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
