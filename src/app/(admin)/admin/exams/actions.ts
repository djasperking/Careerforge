"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermissionApi } from "@/lib/session";
import { audit } from "@/lib/audit";
import { ApiError } from "@/lib/api";
import { withAIUsage } from "@/lib/ai";
import { examSettingsSchema, questionFormSchema, aiQuestionGenSchema } from "@/lib/exam/schema";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };
function fail(err: unknown): Result<never> {
  if (err instanceof ApiError) return { ok: false, error: err.message };
  console.error(err);
  return { ok: false, error: "Something went wrong. Please try again." };
}

export async function createExam(raw: unknown): Promise<Result<{ id: string }>> {
  try {
    const admin = await requirePermissionApi("exams:write");
    const input = examSettingsSchema.parse(raw);
    const exam = await db.exam.create({
      data: {
        title: input.title,
        description: input.description || null,
        courseId: input.courseId || null,
        timeLimitMinutes: input.timeLimitMinutes,
        questionCount: input.questionCount,
        passingScore: input.passingScore,
        maxAttempts: input.maxAttempts,
        randomizeQuestions: input.randomizeQuestions,
        randomizeOptions: input.randomizeOptions,
        gradingMode: input.gradingMode,
        revealAnswers: input.revealAnswers,
      },
    });
    await audit({ actorId: admin.id, action: "EXAM_CREATED", entity: "Exam", entityId: exam.id });
    revalidatePath("/admin/exams");
    return { ok: true, data: { id: exam.id } };
  } catch (err) {
    return fail(err);
  }
}

export async function updateExamSettings(examId: string, raw: unknown): Promise<Result<null>> {
  try {
    const admin = await requirePermissionApi("exams:write");
    const input = examSettingsSchema.parse(raw);
    await db.exam.update({
      where: { id: examId },
      data: {
        title: input.title,
        description: input.description || null,
        courseId: input.courseId || null,
        timeLimitMinutes: input.timeLimitMinutes,
        questionCount: input.questionCount,
        passingScore: input.passingScore,
        maxAttempts: input.maxAttempts,
        randomizeQuestions: input.randomizeQuestions,
        randomizeOptions: input.randomizeOptions,
        gradingMode: input.gradingMode,
        revealAnswers: input.revealAnswers,
      },
    });
    await audit({ actorId: admin.id, action: "EXAM_UPDATED", entity: "Exam", entityId: examId });
    revalidatePath(`/admin/exams/${examId}`);
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}

export async function setExamStatus(examId: string, status: "DRAFT" | "PUBLISHED" | "UNPUBLISHED" | "ARCHIVED"): Promise<Result<null>> {
  try {
    const admin = await requirePermissionApi("exams:write");
    if (status === "PUBLISHED") {
      const approved = await db.question.count({ where: { examId, reviewStatus: "APPROVED" } });
      if (approved === 0) throw new ApiError(422, "NO_QUESTIONS", "Approve at least one question before publishing.");
    }
    await db.exam.update({ where: { id: examId }, data: { status } });
    await audit({ actorId: admin.id, action: `EXAM_${status}`, entity: "Exam", entityId: examId });
    revalidatePath(`/admin/exams/${examId}`);
    revalidatePath("/admin/exams");
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteExam(examId: string): Promise<Result<null>> {
  try {
    const admin = await requirePermissionApi("exams:write");
    const attempts = await db.examAttempt.count({ where: { examId } });
    if (attempts > 0) throw new ApiError(409, "HAS_ATTEMPTS", "This exam has attempts — archive it instead of deleting.");
    await db.exam.delete({ where: { id: examId } });
    await audit({ actorId: admin.id, action: "EXAM_DELETED", entity: "Exam", entityId: examId });
    revalidatePath("/admin/exams");
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}

// ---- Questions --------------------------------------------------------

export async function createQuestion(examId: string, raw: unknown): Promise<Result<null>> {
  try {
    const admin = await requirePermissionApi("exams:write");
    const input = questionFormSchema.parse(raw);
    const last = await db.question.findFirst({ where: { examId }, orderBy: { position: "desc" } });
    await db.question.create({
      data: {
        examId,
        type: input.type,
        prompt: input.prompt,
        explanation: input.explanation || null,
        points: input.points,
        difficulty: input.difficulty || null,
        topic: input.topic || null,
        reviewStatus: "APPROVED",
        position: (last?.position ?? 0) + 1,
        options: { create: input.options.map((o, i) => ({ text: o.text, isCorrect: o.isCorrect, position: i })) },
      },
    });
    await audit({ actorId: admin.id, action: "QUESTION_CREATED", entity: "Exam", entityId: examId });
    revalidatePath(`/admin/exams/${examId}`);
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}

export async function updateQuestion(questionId: string, examId: string, raw: unknown): Promise<Result<null>> {
  try {
    await requirePermissionApi("exams:write");
    const input = questionFormSchema.parse(raw);
    await db.$transaction([
      db.questionOption.deleteMany({ where: { questionId } }),
      db.question.update({
        where: { id: questionId },
        data: {
          type: input.type,
          prompt: input.prompt,
          explanation: input.explanation || null,
          points: input.points,
          difficulty: input.difficulty || null,
          topic: input.topic || null,
          options: { create: input.options.map((o, i) => ({ text: o.text, isCorrect: o.isCorrect, position: i })) },
        },
      }),
    ]);
    revalidatePath(`/admin/exams/${examId}`);
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteQuestion(questionId: string, examId: string): Promise<Result<null>> {
  try {
    const admin = await requirePermissionApi("exams:write");
    await db.question.delete({ where: { id: questionId } });
    await audit({ actorId: admin.id, action: "QUESTION_DELETED", entity: "Exam", entityId: examId });
    revalidatePath(`/admin/exams/${examId}`);
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}

export async function setQuestionReview(questionId: string, examId: string, status: "APPROVED" | "REJECTED"): Promise<Result<null>> {
  try {
    const admin = await requirePermissionApi("exams:write");
    if (status === "REJECTED") {
      await db.question.delete({ where: { id: questionId } });
    } else {
      await db.question.update({ where: { id: questionId }, data: { reviewStatus: status } });
    }
    await audit({ actorId: admin.id, action: `QUESTION_${status}`, entity: "Exam", entityId: examId });
    revalidatePath(`/admin/exams/${examId}`);
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}

export async function generateQuestionsWithAI(examId: string, raw: unknown): Promise<Result<{ count: number }>> {
  try {
    const admin = await requirePermissionApi("exams:write");
    const input = aiQuestionGenSchema.parse(raw);
    const exam = await db.exam.findUniqueOrThrow({ where: { id: examId }, include: { course: true } });

    const result = await withAIUsage({ userId: admin.id, feature: "exam.generate_questions" }, (provider) =>
      provider.generateQuestions(
        { courseTitle: exam.course?.title, topic: input.topic, difficulty: input.difficulty, count: input.count, type: input.type },
        { userId: admin.id, feature: "exam.generate_questions" },
      ),
    );

    const last = await db.question.findFirst({ where: { examId }, orderBy: { position: "desc" } });
    let position = last?.position ?? 0;

    for (const q of result.data) {
      position += 1;
      await db.question.create({
        data: {
          examId,
          type: input.type,
          prompt: q.prompt,
          explanation: q.explanation,
          points: 1,
          difficulty: q.difficulty || input.difficulty,
          topic: q.topic || input.topic,
          aiGenerated: true,
          reviewStatus: "DRAFT",
          position,
          options: input.type === "SHORT_ANSWER"
            ? { create: q.correctAnswerText ? [{ text: q.correctAnswerText, isCorrect: true, position: 0 }] : [] }
            : { create: q.options.map((o, i) => ({ text: o.text, isCorrect: o.isCorrect, position: i })) },
        },
      });
    }

    await audit({ actorId: admin.id, action: "QUESTIONS_AI_GENERATED", entity: "Exam", entityId: examId, metadata: { count: result.data.length } });
    revalidatePath(`/admin/exams/${examId}`);
    return { ok: true, data: { count: result.data.length } };
  } catch (err) {
    return fail(err);
  }
}

export async function gradeAnswerManually(
  answerId: string,
  attemptId: string,
  awardedPoints: number,
  feedback: string,
): Promise<Result<null>> {
  try {
    const admin = await requirePermissionApi("exams:grade");
    const answer = await db.examAnswer.findUniqueOrThrow({ where: { id: answerId }, include: { question: true } });
    const points = Math.min(Math.max(0, awardedPoints), answer.question.points);
    await db.examAnswer.update({
      where: { id: answerId },
      data: { awardedPoints: points, isCorrect: points >= answer.question.points * 0.6, gradedBy: admin.id, gradedAt: new Date() },
    });
    await audit({ actorId: admin.id, action: "ANSWER_GRADED", entity: "ExamAttempt", entityId: attemptId, metadata: { feedback } });

    const { finalizeAttemptIfComplete } = await import("@/lib/exam/service");
    await finalizeAttemptIfComplete(attemptId);

    revalidatePath("/admin/exams");
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}
