"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermissionApi, requireUserApi } from "@/lib/session";
import { audit } from "@/lib/audit";
import { ApiError } from "@/lib/api";
import { courseFormSchema, moduleFormSchema, lessonFormSchema, linesToList } from "@/lib/course/schema";
import { uniqueCourseSlug, assertCanEditCourse } from "@/lib/course/service";

/** Re-render whichever course editor the caller is using. */
function revalidateCourse(courseId: string) {
  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath(`/instructor/courses/${courseId}`);
}

type Result<T> = { ok: true; data: T } | { ok: false; error: string };
function fail(err: unknown): Result<never> {
  if (err instanceof ApiError) return { ok: false, error: err.message };
  console.error(err);
  return { ok: false, error: "Something went wrong. Please try again." };
}

export async function createCourse(raw: unknown): Promise<Result<{ id: string }>> {
  try {
    const admin = await requirePermissionApi("courses:write");
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
        instructorId: admin.id,
        // Admin-authored courses don't go through the instructor review queue.
        reviewStatus: "APPROVED",
        reviewedAt: new Date(),
        reviewedById: admin.id,
      },
    });
    await audit({ actorId: admin.id, action: "COURSE_CREATED", entity: "Course", entityId: course.id });
    revalidatePath("/admin/courses");
    return { ok: true, data: { id: course.id } };
  } catch (err) {
    return fail(err);
  }
}

export async function updateCourse(id: string, raw: unknown): Promise<Result<null>> {
  try {
    const admin = await requirePermissionApi("courses:write");
    const input = courseFormSchema.parse(raw);
    const existing = await db.course.findUniqueOrThrow({ where: { id } });
    const slug = existing.title === input.title ? existing.slug : await uniqueCourseSlug(input.title, id);

    await db.course.update({
      where: { id },
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
      },
    });
    await audit({ actorId: admin.id, action: "COURSE_UPDATED", entity: "Course", entityId: id });
    revalidatePath(`/admin/courses/${id}`);
    revalidatePath("/admin/courses");
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}

export async function setCourseStatus(id: string, status: "PUBLISHED" | "UNPUBLISHED" | "DRAFT" | "ARCHIVED"): Promise<Result<null>> {
  try {
    const admin = await requirePermissionApi("courses:publish");
    const course = await db.course.findUniqueOrThrow({ where: { id } });
    // Only block publish while a course is inside the instructor review flow —
    // admin-authored courses (DRAFT/APPROVED) publish directly from here.
    if (status === "PUBLISHED" && (course.reviewStatus === "SUBMITTED" || course.reviewStatus === "CHANGES_REQUESTED")) {
      throw new ApiError(409, "IN_REVIEW", "This course is in the instructor review flow — resolve it in the review queue first.");
    }
    await db.course.update({
      where: { id },
      data: { status, publishedAt: status === "PUBLISHED" && !course.publishedAt ? new Date() : course.publishedAt },
    });
    await audit({ actorId: admin.id, action: `COURSE_${status}`, entity: "Course", entityId: id });
    revalidatePath(`/admin/courses/${id}`);
    revalidatePath("/admin/courses");
    revalidatePath("/courses");
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteCourse(id: string): Promise<Result<null>> {
  try {
    const admin = await requirePermissionApi("courses:delete");
    const enrollmentCount = await db.enrollment.count({ where: { courseId: id } });
    if (enrollmentCount > 0) {
      throw new ApiError(409, "HAS_ENROLLMENTS", "This course has enrollments — archive it instead of deleting.");
    }
    await db.course.delete({ where: { id } });
    await audit({ actorId: admin.id, action: "COURSE_DELETED", entity: "Course", entityId: id });
    revalidatePath("/admin/courses");
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}

export async function duplicateCourse(id: string): Promise<Result<{ id: string }>> {
  try {
    const admin = await requirePermissionApi("courses:write");
    const source = await db.course.findUniqueOrThrow({
      where: { id },
      include: { modules: { include: { lessons: true }, orderBy: { position: "asc" } } },
    });
    const slug = await uniqueCourseSlug(`${source.title} copy`);

    const copy = await db.course.create({
      data: {
        slug,
        title: `${source.title} (copy)`,
        description: source.description,
        thumbnailUrl: source.thumbnailUrl,
        categoryId: source.categoryId,
        level: source.level,
        durationMinutes: source.durationMinutes,
        priceCents: source.priceCents,
        currency: source.currency,
        requirements: source.requirements,
        objectives: source.objectives,
        instructorId: admin.id,
        status: "DRAFT",
        modules: {
          create: source.modules.map((m) => ({
            title: m.title,
            position: m.position,
            lessons: {
              create: m.lessons.map((l) => ({
                title: l.title,
                type: l.type,
                position: l.position,
                videoUrl: l.videoUrl,
                content: l.content,
                durationSeconds: l.durationSeconds,
                isPreview: l.isPreview,
              })),
            },
          })),
        },
      },
    });
    await audit({ actorId: admin.id, action: "COURSE_DUPLICATED", entity: "Course", entityId: copy.id, metadata: { from: id } });
    revalidatePath("/admin/courses");
    return { ok: true, data: { id: copy.id } };
  } catch (err) {
    return fail(err);
  }
}

// ---- Modules ------------------------------------------------------------

export async function createModule(courseId: string, raw: unknown): Promise<Result<null>> {
  try {
    const user = await requireUserApi();
    await assertCanEditCourse(user, courseId);
    const input = moduleFormSchema.parse(raw);
    const last = await db.courseModule.findFirst({ where: { courseId }, orderBy: { position: "desc" } });
    await db.courseModule.create({ data: { courseId, title: input.title, position: (last?.position ?? 0) + 1 } });
    await audit({ actorId: user.id, action: "MODULE_CREATED", entity: "Course", entityId: courseId });
    revalidateCourse(courseId);
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}

export async function updateModule(moduleId: string, courseId: string, raw: unknown): Promise<Result<null>> {
  try {
    const user = await requireUserApi();
    await assertCanEditCourse(user, courseId);
    const input = moduleFormSchema.parse(raw);
    await db.courseModule.update({ where: { id: moduleId, courseId }, data: { title: input.title } });
    revalidateCourse(courseId);
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteModule(moduleId: string, courseId: string): Promise<Result<null>> {
  try {
    const user = await requireUserApi();
    await assertCanEditCourse(user, courseId);
    await db.courseModule.delete({ where: { id: moduleId, courseId } });
    await audit({ actorId: user.id, action: "MODULE_DELETED", entity: "Course", entityId: courseId });
    revalidateCourse(courseId);
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}

export async function moveModule(moduleId: string, courseId: string, direction: "up" | "down"): Promise<Result<null>> {
  try {
    const user = await requireUserApi();
    await assertCanEditCourse(user, courseId);
    const modules = await db.courseModule.findMany({ where: { courseId }, orderBy: { position: "asc" } });
    const idx = modules.findIndex((m) => m.id === moduleId);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (idx < 0 || swapIdx < 0 || swapIdx >= modules.length) return { ok: true, data: null };

    const a = modules[idx];
    const b = modules[swapIdx];
    await db.$transaction([
      db.courseModule.update({ where: { id: a.id }, data: { position: -1 } }),
      db.courseModule.update({ where: { id: b.id }, data: { position: a.position } }),
      db.courseModule.update({ where: { id: a.id }, data: { position: b.position } }),
    ]);
    revalidateCourse(courseId);
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}

// ---- Lessons --------------------------------------------------------------

export async function createLesson(moduleId: string, courseId: string, raw: unknown): Promise<Result<null>> {
  try {
    const user = await requireUserApi();
    await assertCanEditCourse(user, courseId);
    const input = lessonFormSchema.parse(raw);
    const mod = await db.courseModule.findFirst({ where: { id: moduleId, courseId } });
    if (!mod) throw new ApiError(404, "NOT_FOUND", "Module not found.");
    const last = await db.lesson.findFirst({ where: { moduleId }, orderBy: { position: "desc" } });
    await db.lesson.create({
      data: {
        moduleId,
        title: input.title,
        type: input.type,
        videoUrl: input.videoUrl || null,
        content: input.content || null,
        durationSeconds: input.durationSeconds,
        isPreview: input.isPreview,
        position: (last?.position ?? 0) + 1,
      },
    });
    await audit({ actorId: user.id, action: "LESSON_CREATED", entity: "Course", entityId: courseId });
    revalidateCourse(courseId);
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}

export async function updateLesson(lessonId: string, courseId: string, raw: unknown): Promise<Result<null>> {
  try {
    const user = await requireUserApi();
    await assertCanEditCourse(user, courseId);
    const input = lessonFormSchema.parse(raw);
    const owned = await db.lesson.findFirst({ where: { id: lessonId, module: { courseId } } });
    if (!owned) throw new ApiError(404, "NOT_FOUND", "Lesson not found.");
    await db.lesson.update({
      where: { id: lessonId },
      data: {
        title: input.title,
        type: input.type,
        videoUrl: input.videoUrl || null,
        content: input.content || null,
        durationSeconds: input.durationSeconds,
        isPreview: input.isPreview,
      },
    });
    revalidateCourse(courseId);
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteLesson(lessonId: string, courseId: string): Promise<Result<null>> {
  try {
    const user = await requireUserApi();
    await assertCanEditCourse(user, courseId);
    const owned = await db.lesson.findFirst({ where: { id: lessonId, module: { courseId } } });
    if (!owned) throw new ApiError(404, "NOT_FOUND", "Lesson not found.");
    await db.lesson.delete({ where: { id: lessonId } });
    await audit({ actorId: user.id, action: "LESSON_DELETED", entity: "Course", entityId: courseId });
    revalidateCourse(courseId);
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}

export async function moveLesson(lessonId: string, moduleId: string, courseId: string, direction: "up" | "down"): Promise<Result<null>> {
  try {
    const user = await requireUserApi();
    await assertCanEditCourse(user, courseId);
    const lessons = await db.lesson.findMany({ where: { moduleId, module: { courseId } }, orderBy: { position: "asc" } });
    const idx = lessons.findIndex((l) => l.id === lessonId);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (idx < 0 || swapIdx < 0 || swapIdx >= lessons.length) return { ok: true, data: null };

    const a = lessons[idx];
    const b = lessons[swapIdx];
    await db.$transaction([
      db.lesson.update({ where: { id: a.id }, data: { position: -1 } }),
      db.lesson.update({ where: { id: b.id }, data: { position: a.position } }),
      db.lesson.update({ where: { id: a.id }, data: { position: b.position } }),
    ]);
    revalidateCourse(courseId);
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}

export async function createCategory(name: string): Promise<Result<{ id: string; name: string }>> {
  try {
    await requirePermissionApi("courses:write");
    const key = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    if (!key) throw new ApiError(422, "INVALID_NAME", "Enter a category name.");
    const category = await db.category.upsert({
      where: { key },
      update: {},
      create: { key, name: name.trim(), kind: "course" },
    });
    revalidatePath("/admin/courses");
    return { ok: true, data: { id: category.id, name: category.name } };
  } catch (err) {
    return fail(err);
  }
}

/** Admin moderation of a course review. */
export async function moderateReview(
  reviewId: string,
  action: "hide" | "show" | "delete",
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const admin = await requirePermissionApi("courses:write");
    const review = await db.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new ApiError(404, "NOT_FOUND", "Review not found.");
    if (action === "delete") {
      await db.review.delete({ where: { id: reviewId } });
    } else {
      await db.review.update({ where: { id: reviewId }, data: { status: action === "hide" ? "HIDDEN" : "VISIBLE" } });
    }
    await audit({ actorId: admin.id, action: `REVIEW_${action.toUpperCase()}`, entity: "Review", entityId: reviewId });
    revalidateCourse(review.courseId);
    return { ok: true };
  } catch (err) {
    if (err instanceof ApiError) return { ok: false, error: err.message };
    console.error(err);
    return { ok: false, error: "Something went wrong." };
  }
}
