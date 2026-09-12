"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { requireUserApi } from "@/lib/session";
import { audit } from "@/lib/audit";
import { requireApprovedInstructor, requireOwnedCourse } from "@/lib/instructor/service";
import { requireOwnedCohort } from "@/lib/cohort/service";
import { majorToMinor } from "@/lib/utils";
import { createDailyRoom } from "@/lib/video/daily";
import type { CohortStatus } from "@prisma/client";

type Result<T = null> = { ok: true; data: T } | { ok: false; error: string };
function fail(err: unknown): Result<never> {
  if (err instanceof ApiError) return { ok: false, error: err.message };
  console.error(err);
  return { ok: false, error: "Something went wrong. Please try again." };
}

const cohortSchema = z.object({
  title: z.string().min(3).max(160),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  enrollByDate: z.string().optional(),
  capacity: z.coerce.number().int().min(0).max(100_000),
  priceNaira: z.coerce.number().min(0).max(10_000_000).optional(),
  meetingUrl: z.string().url().or(z.literal("")).optional(),
  scheduleNote: z.string().max(2000).optional(),
  minAttendancePercent: z.coerce.number().int().min(0).max(100).optional(),
});

function parseDates(d: { startDate: string; endDate: string; enrollByDate?: string }) {
  const start = new Date(d.startDate);
  const end = new Date(d.endDate);
  const enrollBy = d.enrollByDate ? new Date(d.enrollByDate) : null;
  if (Number.isNaN(+start) || Number.isNaN(+end)) throw new ApiError(422, "BAD_DATE", "Enter valid start and end dates.");
  if (end < start) throw new ApiError(422, "BAD_DATE", "The end date must be after the start date.");
  if (enrollBy && Number.isNaN(+enrollBy)) throw new ApiError(422, "BAD_DATE", "Enter a valid enrolment deadline.");
  return { start, end, enrollBy };
}

export async function createCohort(courseId: string, input: unknown): Promise<Result<{ id: string }>> {
  try {
    const user = await requireUserApi();
    await requireApprovedInstructor(user.id);
    const course = await requireOwnedCourse(user.id, courseId);
    const d = cohortSchema.parse(input);
    const { start, end, enrollBy } = parseDates(d);

    const cohort = await db.cohort.create({
      data: {
        courseId,
        title: d.title.trim(),
        startDate: start,
        endDate: end,
        enrollByDate: enrollBy,
        capacity: d.capacity,
        priceCents: d.priceNaira != null && d.priceNaira > 0 ? majorToMinor(d.priceNaira) : null,
        currency: course.currency,
        meetingUrl: d.meetingUrl || null,
        scheduleNote: d.scheduleNote?.trim() || null,
        minAttendancePercent: d.minAttendancePercent ?? 0,
      },
    });
    await audit({ actorId: user.id, action: "COHORT_CREATED", entity: "Cohort", entityId: cohort.id });
    revalidatePath(`/instructor/courses/${courseId}/cohorts`);
    return { ok: true, data: { id: cohort.id } };
  } catch (err) {
    return fail(err);
  }
}

export async function updateCohort(cohortId: string, input: unknown): Promise<Result> {
  try {
    const user = await requireUserApi();
    const cohort = await requireOwnedCohort(user.id, cohortId);
    const d = cohortSchema.parse(input);
    const { start, end, enrollBy } = parseDates(d);

    await db.cohort.update({
      where: { id: cohortId },
      data: {
        title: d.title.trim(),
        startDate: start,
        endDate: end,
        enrollByDate: enrollBy,
        capacity: d.capacity,
        priceCents: d.priceNaira != null && d.priceNaira > 0 ? majorToMinor(d.priceNaira) : null,
        meetingUrl: d.meetingUrl || null,
        scheduleNote: d.scheduleNote?.trim() || null,
        minAttendancePercent: d.minAttendancePercent ?? 0,
      },
    });
    revalidatePath(`/instructor/courses/${cohort.courseId}/cohorts/${cohortId}`);
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}

const NEXT: Record<CohortStatus, CohortStatus[]> = {
  DRAFT: ["OPEN", "CANCELLED"],
  OPEN: ["RUNNING", "CANCELLED", "DRAFT"],
  RUNNING: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: ["DRAFT"],
};

export async function setCohortStatus(cohortId: string, status: CohortStatus): Promise<Result> {
  try {
    const user = await requireUserApi();
    const cohort = await requireOwnedCohort(user.id, cohortId);
    if (!NEXT[cohort.status].includes(status)) {
      throw new ApiError(409, "BAD_TRANSITION", `Can't move a ${cohort.status.toLowerCase()} class to ${status.toLowerCase()}.`);
    }
    if (status === "OPEN" && cohort.course.reviewStatus !== "APPROVED") {
      throw new ApiError(409, "COURSE_NOT_APPROVED", "The parent course must be approved before you can open a class.");
    }
    await db.cohort.update({ where: { id: cohortId }, data: { status } });
    await audit({ actorId: user.id, action: "COHORT_STATUS", entity: "Cohort", entityId: cohortId, metadata: { status } });

    if (status === "COMPLETED") {
      const { issueCohortCertificates } = await import("@/lib/certificate/service");
      await issueCohortCertificates(cohortId).catch((err) => console.error("cohort certificates failed", err));
    }

    revalidatePath(`/instructor/courses/${cohort.courseId}/cohorts/${cohortId}`);
    revalidatePath(`/instructor/courses/${cohort.courseId}/cohorts`);
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}

/** Manually (re)issue certificates for a completed cohort. */
export async function issueCohortCertificatesAction(
  cohortId: string,
): Promise<Result<{ issued: number; skipped: { name: string; reason: string }[]; rosterSize: number }>> {
  try {
    const user = await requireUserApi();
    const cohort = await requireOwnedCohort(user.id, cohortId);
    if (cohort.status !== "COMPLETED") {
      throw new ApiError(409, "NOT_COMPLETED", "Mark the class completed before issuing certificates.");
    }
    const { issueCohortCertificates } = await import("@/lib/certificate/service");
    const result = await issueCohortCertificates(cohortId);
    await audit({
      actorId: user.id,
      action: "COHORT_CERTIFICATES_ISSUED",
      entity: "Cohort",
      entityId: cohortId,
      metadata: { issued: result.issued, skipped: result.skipped.length },
    });
    revalidatePath(`/instructor/courses/${cohort.courseId}/cohorts/${cohortId}`);
    return { ok: true, data: result };
  } catch (err) {
    return fail(err);
  }
}

const sessionSchema = z.object({
  title: z.string().min(2).max(160),
  startsAt: z.string().min(1),
  durationMinutes: z.coerce.number().int().min(5).max(600),
  meetingUrl: z.string().url().or(z.literal("")).optional(),
  note: z.string().max(1000).optional(),
});

export async function addSession(cohortId: string, input: unknown): Promise<Result> {
  try {
    const user = await requireUserApi();
    const cohort = await requireOwnedCohort(user.id, cohortId);
    const d = sessionSchema.parse(input);
    const startsAt = new Date(d.startsAt);
    if (Number.isNaN(+startsAt)) throw new ApiError(422, "BAD_DATE", "Enter a valid session time.");

    // No link pasted in? Auto-generate one via Daily.co so there's always a
    // video-call link, without forcing the instructor to go find one.
    const meetingUrl =
      d.meetingUrl ||
      (await createDailyRoom({
        name: `cf-${cohortId}`,
        expiresAt: new Date(startsAt.getTime() + (d.durationMinutes + 60) * 60_000),
        maxParticipants: cohort.capacity || undefined,
      }));

    await db.cohortSession.create({
      data: {
        cohortId,
        title: d.title.trim(),
        startsAt,
        durationMinutes: d.durationMinutes,
        meetingUrl: meetingUrl || null,
        note: d.note?.trim() || null,
      },
    });
    revalidatePath(`/instructor/courses/${cohort.courseId}/cohorts/${cohortId}`);
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteSession(sessionId: string): Promise<Result> {
  try {
    const user = await requireUserApi();
    const session = await db.cohortSession.findUnique({
      where: { id: sessionId },
      include: { cohort: { select: { id: true, courseId: true, course: { select: { instructorId: true } } } } },
    });
    if (!session || session.cohort.course.instructorId !== user.id) {
      throw new ApiError(404, "NOT_FOUND", "Session not found.");
    }
    await db.cohortSession.delete({ where: { id: sessionId } });
    revalidatePath(`/instructor/courses/${session.cohort.courseId}/cohorts/${session.cohort.id}`);
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}

export async function notifyCohortWaitlist(cohortId: string): Promise<Result> {
  try {
    const user = await requireUserApi();
    const cohort = await requireOwnedCohort(user.id, cohortId);
    const { notifyWaitlist } = await import("@/lib/cohort/service");
    const n = await notifyWaitlist(cohortId);
    await audit({ actorId: user.id, action: "COHORT_WAITLIST_NOTIFIED", entity: "Cohort", entityId: cohortId, metadata: { count: n } });
    revalidatePath(`/instructor/courses/${cohort.courseId}/cohorts/${cohortId}`);
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}

export async function saveAttendance(
  sessionId: string,
  entries: { userId: string; present: boolean }[],
): Promise<Result> {
  try {
    const user = await requireUserApi();
    const session = await db.cohortSession.findUnique({
      where: { id: sessionId },
      include: { cohort: { select: { id: true, courseId: true, course: { select: { instructorId: true } } } } },
    });
    if (!session || session.cohort.course.instructorId !== user.id) {
      throw new ApiError(404, "NOT_FOUND", "Session not found.");
    }
    const { markAttendance } = await import("@/lib/cohort/service");
    await markAttendance(sessionId, entries);
    revalidatePath(`/instructor/courses/${session.cohort.courseId}/cohorts/${session.cohort.id}`);
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}
