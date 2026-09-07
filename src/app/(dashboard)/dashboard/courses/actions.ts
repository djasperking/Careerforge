"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUserApi } from "@/lib/session";
import { audit } from "@/lib/audit";
import { ApiError } from "@/lib/api";
import { sendEmail } from "@/lib/email";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };
function fail(err: unknown): Result<never> {
  if (err instanceof ApiError) return { ok: false, error: err.message };
  console.error(err);
  return { ok: false, error: "Something went wrong. Please try again." };
}

/**
 * Free courses enroll instantly. Paid courses go through checkout instead —
 * see startCourseCheckout in dashboard/payments/actions.ts — this action
 * only ever creates a free enrollment.
 */
export async function enrollInCourse(courseId: string): Promise<Result<{ enrolled: true }>> {
  try {
    const user = await requireUserApi();
    const course = await db.course.findUnique({ where: { id: courseId } });
    if (!course || course.status !== "PUBLISHED") {
      throw new ApiError(404, "NOT_FOUND", "This course is not available.");
    }

    const existing = await db.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId } } });
    if (existing) return { ok: true, data: { enrolled: true } };

    if (course.priceCents > 0) {
      throw new ApiError(402, "PAYMENT_REQUIRED", "This is a paid course — start checkout instead.");
    }

    await db.enrollment.create({ data: { userId: user.id, courseId } });
    await audit({ actorId: user.id, action: "COURSE_ENROLLED", entity: "Course", entityId: courseId });
    await db.notification.create({
      data: {
        userId: user.id,
        type: "COURSE",
        title: "Enrolled",
        body: `You're enrolled in "${course.title}".`,
        linkUrl: `/dashboard/courses/${courseId}`,
      },
    });
    await sendEmail({
      to: user.email,
      template: "course-enrollment",
      subject: `You're enrolled in ${course.title}`,
      data: { courseTitle: course.title },
    }).catch(() => {});

    revalidatePath(`/courses/${course.slug}`);
    revalidatePath("/dashboard/courses");
    return { ok: true, data: { enrolled: true } };
  } catch (err) {
    return fail(err);
  }
}

export async function submitCourseReview(input: {
  courseId: string;
  rating: number;
  body?: string;
}): Promise<Result<{ saved: true }>> {
  try {
    const user = await requireUserApi();
    const { upsertReview } = await import("@/lib/review/service");
    await upsertReview(user.id, input.courseId, input.rating, input.body);
    await audit({ actorId: user.id, action: "COURSE_REVIEWED", entity: "Course", entityId: input.courseId, metadata: { rating: input.rating } });
    const course = await db.course.findUnique({ where: { id: input.courseId }, select: { slug: true } });
    if (course) revalidatePath(`/courses/${course.slug}`);
    revalidatePath(`/dashboard/courses/${input.courseId}`);
    return { ok: true, data: { saved: true } };
  } catch (err) {
    return fail(err);
  }
}

export async function removeCourseReview(courseId: string): Promise<Result<{ removed: true }>> {
  try {
    const user = await requireUserApi();
    const { deleteOwnReview } = await import("@/lib/review/service");
    await deleteOwnReview(user.id, courseId);
    revalidatePath(`/dashboard/courses/${courseId}`);
    return { ok: true, data: { removed: true } };
  } catch (err) {
    return fail(err);
  }
}
