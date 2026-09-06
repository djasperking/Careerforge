import { db } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { ROLES } from "@/lib/rbac";
import type { Course } from "@prisma/client";

/** The caller's instructor application/record, or null if they never applied. */
export async function getInstructorProfile(userId: string) {
  return db.instructorProfile.findUnique({ where: { userId } });
}

/**
 * Assert the caller is an APPROVED instructor. Throws 403 otherwise so pages and
 * actions can share one gate. Returns the profile.
 */
export async function requireApprovedInstructor(userId: string) {
  const profile = await getInstructorProfile(userId);
  if (!profile || profile.status !== "APPROVED") {
    throw new ApiError(403, "NOT_AN_INSTRUCTOR", "You need an approved instructor account to do that.");
  }
  return profile;
}

/** Load a course that the caller owns (as its instructor), or throw 404. */
export async function requireOwnedCourse(userId: string, courseId: string) {
  const course = await db.course.findFirst({ where: { id: courseId, instructorId: userId } });
  if (!course) throw new ApiError(404, "NOT_FOUND", "Course not found.");
  return course;
}

type DiscountFields = Pick<Course, "priceCents" | "discountPercent" | "discountEndsAt">;

/** Whether a course's discount is currently in effect. */
export function discountIsActive(course: DiscountFields): boolean {
  if (!course.discountPercent || course.discountPercent <= 0) return false;
  if (course.discountEndsAt && course.discountEndsAt.getTime() < Date.now()) return false;
  return true;
}

/** The price a buyer actually pays right now, after any active discount. */
export function effectivePriceCents(course: DiscountFields): number {
  if (!discountIsActive(course)) return course.priceCents;
  const off = Math.round((course.priceCents * course.discountPercent!) / 100);
  return Math.max(0, course.priceCents - off);
}

/** Grant the INSTRUCTOR role if the user doesn't already have it. */
export async function ensureInstructorRole(userId: string) {
  const role = await db.role.upsert({
    where: { key: ROLES.INSTRUCTOR },
    update: {},
    create: { key: ROLES.INSTRUCTOR, name: "Instructor", isSystem: true },
  });
  await db.userRole.upsert({
    where: { userId_roleId: { userId, roleId: role.id } },
    update: {},
    create: { userId, roleId: role.id },
  });
}
