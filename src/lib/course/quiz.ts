import { db } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { z } from "zod";

/** Auto-gradable question types available in course quizzes. */
export const QUIZ_QUESTION_TYPES = ["MULTIPLE_CHOICE", "TRUE_FALSE", "MULTIPLE_ANSWER"] as const;

export const quizInputSchema = z.object({
  title: z.string().trim().min(2).max(160),
  passingScore: z.coerce.number().int().min(1).max(100).default(70),
  maxAttempts: z.coerce.number().int().min(0).max(20).default(0),
  questions: z
    .array(
      z.object({
        prompt: z.string().trim().min(1).max(1000),
        type: z.enum(QUIZ_QUESTION_TYPES),
        explanation: z.string().trim().max(1000).optional().or(z.literal("")),
        points: z.coerce.number().int().min(1).max(20).default(1),
        options: z
          .array(z.object({ text: z.string().trim().min(1).max(400), isCorrect: z.boolean() }))
          .min(2)
          .max(8),
      }),
    )
    .min(1)
    .max(50),
});

export type QuizInput = z.infer<typeof quizInputSchema>;

function validateQuestionShape(q: QuizInput["questions"][number], index: number) {
  const correct = q.options.filter((o) => o.isCorrect).length;
  if (q.type === "MULTIPLE_ANSWER") {
    if (correct < 1) throw new ApiError(422, "BAD_QUIZ", `Question ${index + 1}: mark at least one correct answer.`);
  } else if (correct !== 1) {
    throw new ApiError(422, "BAD_QUIZ", `Question ${index + 1}: mark exactly one correct answer.`);
  }
  if (q.type === "TRUE_FALSE" && q.options.length !== 2) {
    throw new ApiError(422, "BAD_QUIZ", `Question ${index + 1}: true/false needs exactly two options.`);
  }
}

/** Full replace of a lesson's quiz + questions. */
export async function saveLessonQuiz(lessonId: string, raw: unknown) {
  const input = quizInputSchema.parse(raw);
  input.questions.forEach(validateQuestionShape);

  await db.$transaction(async (tx) => {
    const quiz = await tx.quiz.upsert({
      where: { lessonId },
      create: { lessonId, title: input.title, passingScore: input.passingScore, maxAttempts: input.maxAttempts },
      update: { title: input.title, passingScore: input.passingScore, maxAttempts: input.maxAttempts },
    });
    await tx.question.deleteMany({ where: { quizId: quiz.id } });
    for (const [qi, q] of input.questions.entries()) {
      await tx.question.create({
        data: {
          quizId: quiz.id,
          type: q.type,
          prompt: q.prompt,
          explanation: q.explanation || null,
          points: q.points,
          position: qi,
          reviewStatus: "APPROVED",
          options: {
            create: q.options.map((o, oi) => ({ text: o.text, isCorrect: o.isCorrect, position: oi })),
          },
        },
      });
    }
  });
}

export async function deleteLessonQuiz(lessonId: string) {
  await db.quiz.deleteMany({ where: { lessonId } });
}

/** Editor view — includes which options are correct. */
export async function getLessonQuizForEditor(lessonId: string) {
  return db.quiz.findUnique({
    where: { lessonId },
    include: {
      questions: {
        orderBy: { position: "asc" },
        include: { options: { orderBy: { position: "asc" } } },
      },
    },
  });
}

export type QuizForLearner = {
  id: string;
  title: string;
  passingScore: number;
  maxAttempts: number;
  questions: {
    id: string;
    type: string;
    prompt: string;
    points: number;
    options: { id: string; text: string }[];
  }[];
};

/** Learner view — correct answers stripped. */
export async function getLessonQuizForLearner(lessonId: string): Promise<QuizForLearner | null> {
  const quiz = await db.quiz.findUnique({
    where: { lessonId },
    include: {
      questions: { orderBy: { position: "asc" }, include: { options: { orderBy: { position: "asc" } } } },
    },
  });
  if (!quiz) return null;
  return {
    id: quiz.id,
    title: quiz.title,
    passingScore: quiz.passingScore,
    maxAttempts: quiz.maxAttempts,
    questions: quiz.questions.map((q) => ({
      id: q.id,
      type: q.type,
      prompt: q.prompt,
      points: q.points,
      options: q.options.map((o) => ({ id: o.id, text: o.text })),
    })),
  };
}

export async function listQuizAttempts(quizId: string, userId: string) {
  return db.quizAttempt.findMany({
    where: { quizId, userId },
    orderBy: { createdAt: "desc" },
  });
}

const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));

type GradableQuestion = { id: string; points: number; explanation: string | null; options: { id: string; isCorrect: boolean }[] };

/** Pure grader — no DB. A question earns its points only on an exact option-set match. */
export function gradeResponses(
  questions: GradableQuestion[],
  responses: Record<string, string[]>,
  passingScore: number,
) {
  let earned = 0;
  let total = 0;
  const perQuestion: GradedQuiz["perQuestion"] = [];
  const cleanAnswers: Record<string, string[]> = {};

  for (const q of questions) {
    total += q.points;
    const correctIds = q.options.filter((o) => o.isCorrect).map((o) => o.id);
    const valid = new Set(q.options.map((o) => o.id));
    const picked = (responses[q.id] ?? []).filter((id) => valid.has(id));
    cleanAnswers[q.id] = picked;
    const correct = sameSet(picked, correctIds);
    if (correct) earned += q.points;
    perQuestion.push({ questionId: q.id, correct, correctOptionIds: correctIds, explanation: q.explanation });
  }

  const scorePercent = total > 0 ? Math.round((earned / total) * 100) : 0;
  return { scorePercent, passed: scorePercent >= passingScore, perQuestion, cleanAnswers };
}

export type GradedQuiz = {
  scorePercent: number;
  passed: boolean;
  attemptsUsed: number;
  attemptsLeft: number | null;
  perQuestion: { questionId: string; correct: boolean; correctOptionIds: string[]; explanation: string | null }[];
};

/**
 * Grade a submission and record the attempt. A question scores its points only
 * when the chosen option set exactly matches the correct set.
 */
export async function gradeAndRecordAttempt(
  lessonId: string,
  userId: string,
  responses: Record<string, string[]>,
): Promise<GradedQuiz> {
  const quiz = await db.quiz.findUnique({
    where: { lessonId },
    include: { questions: { include: { options: true } } },
  });
  if (!quiz || quiz.questions.length === 0) throw new ApiError(404, "NO_QUIZ", "This lesson has no quiz.");

  const priorAttempts = await db.quizAttempt.count({ where: { quizId: quiz.id, userId } });
  if (quiz.maxAttempts > 0 && priorAttempts >= quiz.maxAttempts) {
    throw new ApiError(409, "NO_ATTEMPTS_LEFT", "You've used all your attempts for this quiz.");
  }

  const { scorePercent, passed, perQuestion, cleanAnswers } = gradeResponses(
    quiz.questions,
    responses,
    quiz.passingScore,
  );

  await db.quizAttempt.create({
    data: { quizId: quiz.id, userId, scorePercent, passed, answers: cleanAnswers },
  });

  const attemptsUsed = priorAttempts + 1;
  return {
    scorePercent,
    passed,
    attemptsUsed,
    attemptsLeft: quiz.maxAttempts > 0 ? Math.max(0, quiz.maxAttempts - attemptsUsed) : null,
    perQuestion,
  };
}
