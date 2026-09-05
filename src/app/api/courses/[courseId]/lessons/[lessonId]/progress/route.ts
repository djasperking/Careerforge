import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { handler, ok, ApiError } from "@/lib/api";
import { requireUserApi } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { assertEnrolled, recomputeCourseProgress } from "@/lib/course/service";
import { issueCourseCertificate } from "@/lib/certificate/service";

const bodySchema = z.object({
  event: z.enum(["heartbeat", "complete"]),
  positionSeconds: z.number().int().min(0).max(36_000).optional(),
});

/** Max seconds credited per heartbeat, regardless of the reported gap — this
 * is what makes "report a huge elapsed time" cheating pointless: the server
 * only ever trusts its own clock between successive heartbeats. */
const MAX_CREDIT_SECONDS = 20;

export const POST = handler(async (req: NextRequest, ctx: { params: Promise<{ courseId: string; lessonId: string }> }) => {
  const user = await requireUserApi();
  const { courseId, lessonId } = await ctx.params;
  rateLimit(`lesson-progress:${user.id}:${lessonId}`, { windowSeconds: 4, max: 1 });

  await assertEnrolled(user.id, courseId);
  const { event } = bodySchema.parse(await req.json());

  const lesson = await db.lesson.findFirst({ where: { id: lessonId, module: { courseId } } });
  if (!lesson) throw new ApiError(404, "NOT_FOUND", "Lesson not found in this course.");

  const existing = await db.courseProgress.findUnique({ where: { userId_lessonId: { userId: user.id, lessonId } } });
  const now = new Date();
  const elapsed = existing
    ? Math.min(MAX_CREDIT_SECONDS, Math.max(0, Math.floor((now.getTime() - existing.updatedAt.getTime()) / 1000)))
    : 0;

  const secondsWatched = (existing?.secondsWatched ?? 0) + (event === "heartbeat" ? elapsed : 0);
  const timeBasedComplete =
    lesson.type === "VIDEO" && lesson.durationSeconds > 0 && secondsWatched >= lesson.durationSeconds * 0.9;
  const completed = existing?.completed || event === "complete" || timeBasedComplete;

  await db.courseProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    create: { userId: user.id, lessonId, secondsWatched, completed, completedAt: completed ? now : null },
    update: { secondsWatched, completed, completedAt: completed && !existing?.completed ? now : existing?.completedAt },
  });

  const result = await recomputeCourseProgress(user.id, courseId);
  if (result?.justCompleted) {
    await issueCourseCertificate(user.id, courseId).catch(() => {});
  }

  return ok({ completed, secondsWatched, progressPercent: result?.enrollment.progressPercent ?? 0 });
});
