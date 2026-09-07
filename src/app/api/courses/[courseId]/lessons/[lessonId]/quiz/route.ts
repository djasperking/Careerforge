import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { handler, ok, ApiError } from "@/lib/api";
import { requireUserApi } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { assertEnrolled, markLessonComplete } from "@/lib/course/service";
import { gradeAndRecordAttempt } from "@/lib/course/quiz";

const bodySchema = z.object({
  responses: z.record(z.string(), z.array(z.string()).max(8)),
});

export const POST = handler(async (req: NextRequest, ctx: { params: Promise<{ courseId: string; lessonId: string }> }) => {
  const user = await requireUserApi();
  const { courseId, lessonId } = await ctx.params;
  rateLimit(`quiz-submit:${user.id}:${lessonId}`, { windowSeconds: 5, max: 1 });

  await assertEnrolled(user.id, courseId);
  const lesson = await db.lesson.findFirst({ where: { id: lessonId, module: { courseId } } });
  if (!lesson) throw new ApiError(404, "NOT_FOUND", "Lesson not found in this course.");

  const { responses } = bodySchema.parse(await req.json());
  const result = await gradeAndRecordAttempt(lessonId, user.id, responses);

  if (result.passed) {
    await markLessonComplete(user.id, lessonId, courseId).catch(() => {});
  }

  return ok(result);
});
