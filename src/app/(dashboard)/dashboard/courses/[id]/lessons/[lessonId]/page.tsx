import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { getLessonQuizForLearner, listQuizAttempts } from "@/lib/course/quiz";
import { LessonPlayer } from "./lesson-player";

export default async function LessonPage({ params }: { params: Promise<{ id: string; lessonId: string }> }) {
  const user = await requireUser();
  const { id: courseId, lessonId } = await params;

  const enrollment = await db.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId } } });
  if (!enrollment) notFound();

  const course = await db.course.findUnique({
    where: { id: courseId },
    include: { modules: { include: { lessons: { orderBy: { position: "asc" } } }, orderBy: { position: "asc" } } },
  });
  if (!course) notFound();

  const flatLessons = course.modules.flatMap((m) => m.lessons);
  const idx = flatLessons.findIndex((l) => l.id === lessonId);
  const lesson = flatLessons[idx];
  if (!lesson) notFound();

  const doneRows = await db.courseProgress.findMany({
    where: { userId: user.id, lessonId: { in: flatLessons.map((l) => l.id) }, completed: true },
    select: { lessonId: true },
  });
  const doneIds = new Set(doneRows.map((r) => r.lessonId));
  const progress = { completed: doneIds.has(lesson.id) };

  // Lessons open in order: finish the earlier ones first (exam lessons are taken elsewhere, so they never block).
  const blocker = flatLessons.slice(0, idx).find((l) => l.type !== "EXAM" && !doneIds.has(l.id));
  if (blocker && !progress.completed) redirect(`/dashboard/courses/${courseId}/lessons/${blocker.id}`);

  const quiz = lesson.type === "QUIZ" ? await getLessonQuizForLearner(lesson.id) : null;
  const quizAttempts =
    quiz ? (await listQuizAttempts(quiz.id, user.id)).map((a) => ({ scorePercent: a.scorePercent, passed: a.passed, at: a.createdAt.toISOString() })) : [];
  const assignmentSubmission =
    lesson.type === "ASSIGNMENT"
      ? await db.assignmentSubmission.findUnique({
          where: { lessonId_userId: { lessonId: lesson.id, userId: user.id } },
        })
      : null;

  return (
    <div className={`mx-auto ${lesson.type === "ASSIGNMENT" && lesson.content?.includes("[[workspace") ? "max-w-6xl" : "max-w-3xl"}`}>
      <div className="mb-4 flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/dashboard/courses/${courseId}`}><ArrowLeft className="size-4" /></Link>
        </Button>
        <div>
          <p className="text-xs text-muted-foreground">{course.title}</p>
          <h1 className="font-display text-xl font-semibold">{lesson.title}</h1>
        </div>
      </div>

      <LessonPlayer
        courseId={courseId}
        lessonId={lesson.id}
        type={lesson.type}
        videoUrl={lesson.videoUrl}
        content={lesson.content}
        initiallyCompleted={progress.completed}
        prevLessonId={flatLessons[idx - 1]?.id ?? null}
        nextLessonId={flatLessons[idx + 1]?.id ?? null}
        quiz={quiz}
        quizAttempts={quizAttempts}
        assignment={
          lesson.type === "ASSIGNMENT"
            ? {
                brief: lesson.content,
                submission: assignmentSubmission
                  ? {
                      text: assignmentSubmission.text,
                      fileUrl: assignmentSubmission.fileUrl,
                      fileName: assignmentSubmission.fileName,
                      status: assignmentSubmission.status,
                      feedback: assignmentSubmission.feedback,
                    }
                  : null,
              }
            : null
        }
      />
    </div>
  );
}
