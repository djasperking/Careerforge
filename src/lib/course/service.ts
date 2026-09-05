import { db } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { slugify } from "@/lib/utils";
import { sendEmail } from "@/lib/email";

export async function uniqueCourseSlug(title: string, excludeId?: string) {
  const base = slugify(title) || "course";
  let slug = base;
  let n = 1;
  // Small catalog — a linear probe is fine.
  while (await db.course.findFirst({ where: { slug, NOT: excludeId ? { id: excludeId } : undefined } })) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

/**
 * Recompute a user's progress for a course from CourseProgress rows — the
 * server-side source of truth, never a client-reported percentage. Marks the
 * enrollment COMPLETED the first time every lesson is done.
 */
export async function recomputeCourseProgress(userId: string, courseId: string) {
  const [lessons, enrollment] = await Promise.all([
    db.lesson.findMany({ where: { module: { courseId } }, select: { id: true } }),
    db.enrollment.findUnique({ where: { userId_courseId: { userId, courseId } } }),
  ]);
  if (!enrollment) return null;

  const lessonIds = lessons.map((l) => l.id);
  const completedCount = lessonIds.length
    ? await db.courseProgress.count({ where: { userId, lessonId: { in: lessonIds }, completed: true } })
    : 0;
  const percent = lessonIds.length ? Math.round((completedCount / lessonIds.length) * 100) : 0;
  const nowComplete = lessonIds.length > 0 && completedCount === lessonIds.length;

  const updated = await db.enrollment.update({
    where: { id: enrollment.id },
    data: {
      progressPercent: percent,
      status: nowComplete ? "COMPLETED" : enrollment.status === "COMPLETED" ? "COMPLETED" : "ACTIVE",
      completedAt: nowComplete && !enrollment.completedAt ? new Date() : enrollment.completedAt,
    },
  });

  const justCompleted = nowComplete && !enrollment.completedAt;
  if (justCompleted) {
    const [user, course] = await Promise.all([
      db.user.findUnique({ where: { id: userId } }),
      db.course.findUnique({ where: { id: courseId } }),
    ]);
    if (user && course) {
      await db.notification.create({
        data: {
          userId,
          type: "COURSE",
          title: "Course completed",
          body: `You completed "${course.title}". Nice work!`,
          linkUrl: `/dashboard/courses/${courseId}`,
        },
      });
      await sendEmail({
        to: user.email,
        template: "course-completion",
        subject: `You completed ${course.title}`,
        data: { name: user.name, courseTitle: course.title },
      }).catch(() => {});
    }
  }

  return { enrollment: updated, justCompleted };
}

export async function assertEnrolled(userId: string, courseId: string) {
  const enrollment = await db.enrollment.findUnique({ where: { userId_courseId: { userId, courseId } } });
  if (!enrollment) throw new ApiError(403, "NOT_ENROLLED", "You are not enrolled in this course.");
  return enrollment;
}
