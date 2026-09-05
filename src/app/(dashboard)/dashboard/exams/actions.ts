"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUserApi } from "@/lib/session";
import { audit } from "@/lib/audit";
import { ApiError } from "@/lib/api";
import { assertEnrolled } from "@/lib/course/service";
import { autoGradeAttempt } from "@/lib/exam/service";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };
function fail(err: unknown): Result<never> {
  if (err instanceof ApiError) return { ok: false, error: err.message };
  console.error(err);
  return { ok: false, error: "Something went wrong. Please try again." };
}

function shuffle<T>(items: T[]) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function startExamAttempt(examId: string): Promise<Result<{ attemptId: string }>> {
  try {
    const user = await requireUserApi();
    const exam = await db.exam.findUnique({ where: { id: examId }, include: { questions: { where: { reviewStatus: "APPROVED" } } } });
    if (!exam || exam.status !== "PUBLISHED") throw new ApiError(404, "NOT_FOUND", "This exam is not available.");
    if (exam.availableFrom && exam.availableFrom > new Date()) throw new ApiError(403, "NOT_YET_AVAILABLE", "This exam is not open yet.");
    if (exam.availableUntil && exam.availableUntil < new Date()) throw new ApiError(403, "CLOSED", "This exam is now closed.");
    if (exam.courseId) await assertEnrolled(user.id, exam.courseId);
    if (exam.questions.length === 0) throw new ApiError(422, "NO_QUESTIONS", "This exam has no approved questions yet.");

    const inProgress = await db.examAttempt.findFirst({ where: { examId, userId: user.id, status: "IN_PROGRESS" } });
    if (inProgress) return { ok: true, data: { attemptId: inProgress.id } };

    const priorCount = await db.examAttempt.count({ where: { examId, userId: user.id, status: { not: "VOIDED" } } });
    if (priorCount >= exam.maxAttempts) {
      throw new ApiError(403, "MAX_ATTEMPTS", `You've used all ${exam.maxAttempts} attempt(s) for this exam.`);
    }

    const pool = exam.randomizeQuestions ? shuffle(exam.questions) : exam.questions;
    const selected = pool.slice(0, exam.questionCount);

    const attempt = await db.examAttempt.create({
      data: {
        examId,
        userId: user.id,
        attemptNumber: priorCount + 1,
        serverDeadline: new Date(Date.now() + exam.timeLimitMinutes * 60_000),
        sessionId: randomUUID(),
        questionIds: selected.map((q) => q.id),
      },
    });
    await audit({ actorId: user.id, action: "EXAM_ATTEMPT_STARTED", entity: "ExamAttempt", entityId: attempt.id });
    return { ok: true, data: { attemptId: attempt.id } };
  } catch (err) {
    return fail(err);
  }
}

export async function saveExamAnswer(input: {
  attemptId: string;
  questionId: string;
  selectedOptionIds?: string[];
  textAnswer?: string;
}): Promise<Result<null>> {
  try {
    const user = await requireUserApi();
    const attempt = await db.examAttempt.findFirst({ where: { id: input.attemptId, userId: user.id } });
    if (!attempt) throw new ApiError(404, "NOT_FOUND", "Attempt not found.");
    if (attempt.status !== "IN_PROGRESS") throw new ApiError(409, "NOT_IN_PROGRESS", "This attempt is no longer active.");
    if (attempt.serverDeadline < new Date()) throw new ApiError(403, "TIME_EXPIRED", "Time is up for this attempt.");

    await db.examAnswer.upsert({
      where: { attemptId_questionId: { attemptId: input.attemptId, questionId: input.questionId } },
      create: {
        attemptId: input.attemptId,
        questionId: input.questionId,
        selectedOptionIds: input.selectedOptionIds ?? [],
        textAnswer: input.textAnswer ?? null,
      },
      update: {
        selectedOptionIds: input.selectedOptionIds ?? [],
        textAnswer: input.textAnswer ?? null,
      },
    });
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}

export async function recordSecurityEvent(attemptId: string, eventType: string): Promise<Result<null>> {
  try {
    const user = await requireUserApi();
    const attempt = await db.examAttempt.findFirst({ where: { id: attemptId, userId: user.id } });
    if (!attempt) return { ok: true, data: null };

    const existing = await db.examSecurityEvent.findFirst({ where: { attemptId, eventType } });
    if (existing) {
      await db.examSecurityEvent.update({ where: { id: existing.id }, data: { occurrences: { increment: 1 } } });
    } else {
      await db.examSecurityEvent.create({
        data: { attemptId, userId: user.id, examId: attempt.examId, sessionId: attempt.sessionId, eventType },
      });
    }
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}

export async function submitExamAttempt(attemptId: string): Promise<Result<null>> {
  try {
    const user = await requireUserApi();
    const attempt = await db.examAttempt.findFirst({ where: { id: attemptId, userId: user.id } });
    if (!attempt) throw new ApiError(404, "NOT_FOUND", "Attempt not found.");
    if (attempt.status !== "IN_PROGRESS") return { ok: true, data: null };

    await db.examAttempt.update({
      where: { id: attemptId },
      data: { status: "SUBMITTED", submittedAt: new Date() },
    });
    await audit({ actorId: user.id, action: "EXAM_ATTEMPT_SUBMITTED", entity: "ExamAttempt", entityId: attemptId });

    await autoGradeAttempt(attemptId);
    revalidatePath(`/dashboard/exams/${attempt.examId}`);
    revalidatePath("/dashboard/exams");
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}
