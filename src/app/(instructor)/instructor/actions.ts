"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUserApi } from "@/lib/session";
import { ApiError } from "@/lib/api";
import { audit } from "@/lib/audit";
import { courseFormSchema, linesToList } from "@/lib/course/schema";
import { uniqueCourseSlug } from "@/lib/course/service";
import { getInstructorProfile, requireApprovedInstructor, requireOwnedCourse } from "@/lib/instructor/service";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };
function fail(err: unknown): Result<never> {
  if (err instanceof ApiError) return { ok: false, error: err.message };
  console.error(err);
  return { ok: false, error: "Something went wrong. Please try again." };
}

const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .url("Enter a full URL, e.g. https://…")
  .optional()
  .or(z.literal(""));

const applicationSchema = z.object({
  headline: z.string().min(6).max(160),
  bio: z.string().min(40).max(3000),
  expertise: z.string().max(600),
  linkedinUrl: optionalUrl,
  portfolioUrl: optionalUrl,
});

export async function applyAsInstructor(raw: unknown): Promise<Result<null>> {
  try {
    const user = await requireUserApi();
    const input = applicationSchema.parse(raw);

    const existing = await getInstructorProfile(user.id);
    if (existing && existing.status !== "REJECTED") {
      throw new ApiError(409, "ALREADY_APPLIED", "You already have an instructor application.");
    }

    const expertise = linesToList(input.expertise.replace(/,/g, "\n"));
    const linkedinUrl = input.linkedinUrl?.trim() || null;
    const portfolioUrl = input.portfolioUrl?.trim() || null;
    if (existing) {
      await db.instructorProfile.update({
        where: { userId: user.id },
        data: { status: "PENDING", headline: input.headline, bio: input.bio, expertise, linkedinUrl, portfolioUrl, reviewNote: null, appliedAt: new Date(), reviewedAt: null, reviewedById: null },
      });
    } else {
      await db.instructorProfile.create({
        data: { userId: user.id, headline: input.headline, bio: input.bio, expertise, linkedinUrl, portfolioUrl },
      });
    }
    await audit({ actorId: user.id, action: "INSTRUCTOR_APPLIED", entity: "InstructorProfile", entityId: user.id });
    revalidatePath("/instructor");
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}

export async function createMyCourse(raw: unknown): Promise<Result<{ id: string }>> {
  try {
    const user = await requireUserApi();
    await requireApprovedInstructor(user.id);
    const input = courseFormSchema.parse(raw);
    const slug = await uniqueCourseSlug(input.title);

    const course = await db.course.create({
      data: {
        slug,
        title: input.title,
        description: input.description,
        thumbnailUrl: input.thumbnailUrl || null,
        categoryId: input.categoryId || null,
        level: input.level,
        durationMinutes: input.durationMinutes,
        priceCents: input.priceCents,
        currency: input.currency,
        requirements: linesToList(input.requirements),
        objectives: linesToList(input.objectives),
        instructorId: user.id,
        status: "DRAFT",
        reviewStatus: "DRAFT",
      },
    });
    await audit({ actorId: user.id, action: "COURSE_CREATED", entity: "Course", entityId: course.id });
    revalidatePath("/instructor/courses");
    return { ok: true, data: { id: course.id } };
  } catch (err) {
    return fail(err);
  }
}

const mySettingsSchema = courseFormSchema.extend({
  discountPercent: z.coerce.number().int().min(0).max(90).optional(),
  discountEndsAt: z.string().optional().or(z.literal("")),
});

export async function updateMyCourse(courseId: string, raw: unknown): Promise<Result<null>> {
  try {
    const user = await requireUserApi();
    await requireApprovedInstructor(user.id);
    const course = await requireOwnedCourse(user.id, courseId);
    if (course.reviewStatus === "SUBMITTED") {
      throw new ApiError(409, "LOCKED", "This course is awaiting review.");
    }
    const input = mySettingsSchema.parse(raw);
    const slug = course.title === input.title ? course.slug : await uniqueCourseSlug(input.title, courseId);

    await db.course.update({
      where: { id: courseId },
      data: {
        slug,
        title: input.title,
        description: input.description,
        thumbnailUrl: input.thumbnailUrl || null,
        categoryId: input.categoryId || null,
        level: input.level,
        durationMinutes: input.durationMinutes,
        priceCents: input.priceCents,
        currency: input.currency,
        requirements: linesToList(input.requirements),
        objectives: linesToList(input.objectives),
        discountPercent: input.discountPercent && input.discountPercent > 0 ? input.discountPercent : null,
        discountEndsAt: input.discountEndsAt ? new Date(input.discountEndsAt) : null,
        // Editing an approved course sends it back to draft (needs re-review to republish).
        reviewStatus: course.reviewStatus === "APPROVED" ? "DRAFT" : course.reviewStatus,
        status: course.reviewStatus === "APPROVED" ? "DRAFT" : course.status,
      },
    });
    await audit({ actorId: user.id, action: "COURSE_UPDATED", entity: "Course", entityId: courseId });
    revalidatePath(`/instructor/courses/${courseId}`);
    revalidatePath("/instructor/courses");
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}

export async function submitCourseForReview(courseId: string): Promise<Result<null>> {
  try {
    const user = await requireUserApi();
    await requireApprovedInstructor(user.id);
    const course = await requireOwnedCourse(user.id, courseId);
    if (course.reviewStatus === "SUBMITTED") throw new ApiError(409, "ALREADY_SUBMITTED", "Already submitted for review.");
    if (course.reviewStatus === "APPROVED") throw new ApiError(409, "ALREADY_APPROVED", "This course is already approved.");

    const lessonCount = await db.lesson.count({ where: { module: { courseId } } });
    if (lessonCount === 0) throw new ApiError(422, "EMPTY_COURSE", "Add at least one lesson before submitting.");
    if (course.description.trim().length < 40) throw new ApiError(422, "THIN_DESCRIPTION", "Write a fuller course description before submitting.");

    await db.course.update({
      where: { id: courseId },
      data: { reviewStatus: "SUBMITTED", submittedAt: new Date(), reviewNote: null },
    });
    await audit({ actorId: user.id, action: "COURSE_SUBMITTED", entity: "Course", entityId: courseId });

    const reviewers = await db.user.findMany({
      where: { roles: { some: { role: { permissions: { some: { permission: { key: "submissions:review" } } } } } } },
      select: { id: true },
      take: 25,
    });
    await db.notification.createMany({
      data: reviewers.map((r) => ({
        userId: r.id,
        type: "ANNOUNCEMENT",
        title: "Course awaiting review",
        body: `"${course.title}" was submitted for review.`,
        linkUrl: "/admin/review",
      })),
    });

    revalidatePath(`/instructor/courses/${courseId}`);
    revalidatePath("/instructor/courses");
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}

export async function setMyCoursePublished(courseId: string, publish: boolean): Promise<Result<null>> {
  try {
    const user = await requireUserApi();
    await requireApprovedInstructor(user.id);
    const course = await requireOwnedCourse(user.id, courseId);
    if (publish && course.reviewStatus !== "APPROVED") {
      throw new ApiError(409, "NOT_APPROVED", "Only an approved course can be published.");
    }
    await db.course.update({
      where: { id: courseId },
      data: {
        status: publish ? "PUBLISHED" : "UNPUBLISHED",
        publishedAt: publish && !course.publishedAt ? new Date() : course.publishedAt,
      },
    });
    await audit({ actorId: user.id, action: publish ? "COURSE_PUBLISHED" : "COURSE_UNPUBLISHED", entity: "Course", entityId: courseId });
    revalidatePath(`/instructor/courses/${courseId}`);
    revalidatePath("/instructor");
    revalidatePath("/courses");
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}

/** Pull a course back to draft (from CHANGES_REQUESTED or APPROVED) to edit it. */
export async function reopenMyCourse(courseId: string): Promise<Result<null>> {
  try {
    const user = await requireUserApi();
    await requireApprovedInstructor(user.id);
    const course = await requireOwnedCourse(user.id, courseId);
    if (course.reviewStatus === "SUBMITTED") throw new ApiError(409, "LOCKED", "Wait for the current review to finish.");

    await db.course.update({
      where: { id: courseId },
      data: { reviewStatus: "DRAFT", status: course.status === "PUBLISHED" ? "DRAFT" : course.status },
    });
    revalidatePath(`/instructor/courses/${courseId}`);
    revalidatePath("/instructor/courses");
    revalidatePath("/courses");
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}
