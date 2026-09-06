import { db } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { slugify } from "@/lib/utils";
import { sendEmail } from "@/lib/email";
import { hasPermission, type PermissionKey } from "@/lib/rbac";

/**
 * A user may edit a course's content if they hold `courses:publish` (admins /
 * course managers — they are also the reviewers, so the review lock never
 * applies to them) OR they are the course's own instructor. Instructor edits
 * are blocked once the course is submitted for review or approved — they must
 * first pull it back to draft.
 */
export async function assertCanEditCourse(
  user: { id: string; permissions: PermissionKey[] | "*" },
  courseId: string,
  { allowLocked = false } = {},
) {
  const course = await db.course.findUnique({ where: { id: courseId } });
  if (!course) throw new ApiError(404, "NOT_FOUND", "Course not found.");

  // Full course managers bypass the review lock entirely.
  if (hasPermission(user.permissions, "courses:publish")) return course;

  // Instructors may only touch their own course, and only while it is in draft.
  if (course.instructorId === user.id) {
    if (!allowLocked && (course.reviewStatus === "SUBMITTED" || course.reviewStatus === "APPROVED")) {
      throw new ApiError(
        409,
        "COURSE_LOCKED",
        course.reviewStatus === "SUBMITTED"
          ? "This course is awaiting review — you can't edit it until a decision is made."
          : "This course is approved. Move it back to draft to make changes.",
      );
    }
    return course;
  }

  throw new ApiError(403, "FORBIDDEN", "You do not have access to this course.");
}

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
