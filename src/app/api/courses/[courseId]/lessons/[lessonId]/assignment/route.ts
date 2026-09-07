import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { handler, ok, ApiError } from "@/lib/api";
import { requireUserApi } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { assertEnrolled, markLessonComplete } from "@/lib/course/service";

const bodySchema = z.object({
  text: z.string().trim().min(1).max(10_000),
  fileUrl: z.string().url().max(600).optional().or(z.literal("")),
  fileName: z.string().max(200).optional().or(z.literal("")),
});

export const POST = handler(async (req: NextRequest, ctx: { params: Promise<{ courseId: string; lessonId: string }> }) => {
  const user = await requireUserApi();
  const { courseId, lessonId } = await ctx.params;
  rateLimit(`assignment-submit:${user.id}:${lessonId}`, { windowSeconds: 10, max: 2 });

  await assertEnrolled(user.id, courseId);
  const lesson = await db.lesson.findFirst({ where: { id: lessonId, module: { courseId } } });
  if (!lesson || lesson.type !== "ASSIGNMENT") throw new ApiError(404, "NOT_FOUND", "Assignment not found in this course.");

  const input = bodySchema.parse(await req.json());

  const submission = await db.assignmentSubmission.upsert({
    where: { lessonId_userId: { lessonId, userId: user.id } },
    create: {
      lessonId,
      userId: user.id,
      text: input.text,
      fileUrl: input.fileUrl || null,
      fileName: input.fileName || null,
    },
    // Resubmitting reopens the review.
    update: {
      text: input.text,
      fileUrl: input.fileUrl || null,
      fileName: input.fileName || null,
      status: "SUBMITTED",
      feedback: null,
      reviewedById: null,
      reviewedAt: null,
    },
  });

  await markLessonComplete(user.id, lessonId, courseId).catch(() => {});

  const instructor = await db.course.findUnique({ where: { id: courseId }, select: { instructorId: true, title: true } });
  if (instructor?.instructorId) {
    await db.notification
      .create({
        data: {
          userId: instructor.instructorId,
          type: "COURSE",
          title: "New assignment submission",
          body: `A learner submitted "${lesson.title}" in ${instructor.title}.`,
          linkUrl: `/instructor/courses/${courseId}/submissions`,
        },
      })
      .catch(() => {});
  }

  return ok({ id: submission.id, status: submission.status });
});
