"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermissionApi } from "@/lib/session";
import { ApiError } from "@/lib/api";
import { audit } from "@/lib/audit";
import { ensureInstructorRole } from "@/lib/instructor/service";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };
function fail(err: unknown): Result<never> {
  if (err instanceof ApiError) return { ok: false, error: err.message };
  console.error(err);
  return { ok: false, error: "Something went wrong. Please try again." };
}

const noteSchema = z.string().max(1000).optional().or(z.literal(""));

// ---- Instructor applications ------------------------------------------------

export async function decideInstructorApplication(
  profileId: string,
  decision: "APPROVED" | "REJECTED",
  rawNote?: unknown,
): Promise<Result<null>> {
  try {
    const admin = await requirePermissionApi("instructors:review");
    const note = noteSchema.parse(rawNote ?? "");
    const profile = await db.instructorProfile.findUnique({ where: { id: profileId }, include: { user: true } });
    if (!profile) throw new ApiError(404, "NOT_FOUND", "Application not found.");
    if (profile.status !== "PENDING") throw new ApiError(409, "ALREADY_DECIDED", "This application was already decided.");

    await db.instructorProfile.update({
      where: { id: profileId },
      data: { status: decision, reviewNote: note || null, reviewedAt: new Date(), reviewedById: admin.id },
    });
    if (decision === "APPROVED") await ensureInstructorRole(profile.userId);

    await db.notification.create({
      data: {
        userId: profile.userId,
        type: "ANNOUNCEMENT",
        title: decision === "APPROVED" ? "You're now an instructor" : "Instructor application update",
        body:
          decision === "APPROVED"
            ? "Your instructor application was approved. You can now create courses."
            : `Your instructor application wasn't approved.${note ? ` Note: ${note}` : ""}`,
        linkUrl: "/instructor",
      },
    });
    await audit({ actorId: admin.id, action: `INSTRUCTOR_${decision}`, entity: "InstructorProfile", entityId: profileId });
    revalidatePath("/admin/review");
    revalidatePath("/admin");
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}

// ---- Course submissions ----------------------------------------------------

export async function decideCourseReview(
  courseId: string,
  decision: "APPROVED" | "CHANGES_REQUESTED" | "REJECTED",
  rawNote?: unknown,
): Promise<Result<null>> {
  try {
    const admin = await requirePermissionApi("instructors:review");
    const note = noteSchema.parse(rawNote ?? "");
    const course = await db.course.findUnique({ where: { id: courseId } });
    if (!course) throw new ApiError(404, "NOT_FOUND", "Course not found.");
    if (course.reviewStatus !== "SUBMITTED") {
      throw new ApiError(409, "NOT_PENDING", "This course is not awaiting review.");
    }
    if ((decision === "CHANGES_REQUESTED" || decision === "REJECTED") && !note) {
      throw new ApiError(422, "NOTE_REQUIRED", "Add a note explaining what needs to change.");
    }

    const nextReview = decision === "APPROVED" ? "APPROVED" : decision === "CHANGES_REQUESTED" ? "CHANGES_REQUESTED" : "DRAFT";
    await db.course.update({
      where: { id: courseId },
      data: {
        reviewStatus: nextReview,
        reviewNote: note || null,
        reviewedAt: new Date(),
        reviewedById: admin.id,
      },
    });

    if (course.instructorId) {
      await db.notification.create({
        data: {
          userId: course.instructorId,
          type: "COURSE",
          title:
            decision === "APPROVED"
              ? `"${course.title}" approved`
              : decision === "CHANGES_REQUESTED"
                ? `Changes requested on "${course.title}"`
                : `"${course.title}" was not approved`,
          body:
            decision === "APPROVED"
              ? "Your course was approved. You can publish it from your instructor dashboard."
              : `Reviewer note: ${note}`,
          linkUrl: `/instructor/courses/${courseId}`,
        },
      });
    }
    await audit({ actorId: admin.id, action: `COURSE_REVIEW_${decision}`, entity: "Course", entityId: courseId });
    revalidatePath("/admin/review");
    revalidatePath("/admin");
    revalidatePath(`/admin/courses/${courseId}`);
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}

/** Admin sets the instructor's revenue share for a specific course. */
export async function setCourseRevenueShare(courseId: string, percent: number): Promise<Result<null>> {
  try {
    const admin = await requirePermissionApi("instructors:review");
    const p = z.coerce.number().int().min(0).max(100).parse(percent);
    await db.course.update({ where: { id: courseId }, data: { revenueSharePercent: p } });
    await audit({ actorId: admin.id, action: "COURSE_REVENUE_SHARE_SET", entity: "Course", entityId: courseId, metadata: { percent: p } });
    revalidatePath("/admin/review");
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}
