import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
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

  const progress = await db.courseProgress.findUnique({ where: { userId_lessonId: { userId: user.id, lessonId } } });

  return (
    <div className="mx-auto max-w-3xl">
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
        initiallyCompleted={progress?.completed ?? false}
        prevLessonId={flatLessons[idx - 1]?.id ?? null}
        nextLessonId={flatLessons[idx + 1]?.id ?? null}
      />
    </div>
  );
}
