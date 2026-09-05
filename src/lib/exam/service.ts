import { db } from "@/lib/db";
import { withAIUsage } from "@/lib/ai";
import { issueExamCertificate } from "@/lib/certificate/service";
import { sendEmail } from "@/lib/email";
import type { Question, QuestionOption } from "@prisma/client";

/** Small deterministic PRNG so a given attempt always reshuffles the same way. */
function seededRandom(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

export function deterministicShuffle<T>(items: T[], seed: string): T[] {
  const rand = seededRandom(seed);
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function shuffledOptionsFor(attemptId: string, question: Question & { options: QuestionOption[] }, randomize: boolean) {
  return randomize ? deterministicShuffle(question.options, `${attemptId}:${question.id}`) : question.options;
}

const OBJECTIVE_TYPES = new Set(["MULTIPLE_CHOICE", "TRUE_FALSE", "MULTIPLE_ANSWER"]);

function gradeObjective(question: Question & { options: QuestionOption[] }, selectedOptionIds: string[]) {
  const correctIds = question.options.filter((o) => o.isCorrect).map((o) => o.id).sort();
  const selected = [...selectedOptionIds].sort();
  const isCorrect = correctIds.length === selected.length && correctIds.every((id, i) => id === selected[i]);
  return { isCorrect, awardedPoints: isCorrect ? question.points : 0 };
}

/**
 * Grade every answer we can grade automatically right now. Essay/short-answer
 * questions are graded by AI only when the exam's gradingMode is AUTO; MANUAL
 * and HYBRID leave them for a human (src/app/(admin)/admin/exams/[id]/grading).
 */
export async function autoGradeAttempt(attemptId: string) {
  const attempt = await db.examAttempt.findUniqueOrThrow({
    where: { id: attemptId },
    include: {
      exam: true,
      answers: { include: { question: { include: { options: true } } } },
    },
  });

  for (const answer of attempt.answers) {
    if (answer.awardedPoints != null) continue; // already graded
    const q = answer.question;

    if (OBJECTIVE_TYPES.has(q.type)) {
      const { isCorrect, awardedPoints } = gradeObjective(q, answer.selectedOptionIds);
      await db.examAnswer.update({ where: { id: answer.id }, data: { isCorrect, awardedPoints } });
    } else if (attempt.exam.gradingMode === "AUTO" && answer.textAnswer) {
      try {
        const result = await withAIUsage({ userId: attempt.userId, feature: "exam.grade" }, (provider) =>
          provider.gradeAnswer(
            { question: q.prompt, answer: answer.textAnswer ?? "", maxPoints: q.points },
            { userId: attempt.userId, feature: "exam.grade" },
          ),
        );
        await db.examAnswer.update({
          where: { id: answer.id },
          data: {
            awardedPoints: Math.min(Math.max(result.data.awardedPoints, 0), q.points),
            isCorrect: result.data.awardedPoints >= q.points * 0.6,
            gradedAt: new Date(),
          },
        });
      } catch {
        // AI grading unavailable — leave for manual review.
      }
    }
  }

  return finalizeAttemptIfComplete(attemptId);
}

/**
 * If every answer now has a grade, compute the final score/percentage/pass
 * and — the first time it passes — issue the certificate. Safe to call
 * repeatedly (e.g. after each manually-graded answer).
 */
export async function finalizeAttemptIfComplete(attemptId: string) {
  const attempt = await db.examAttempt.findUniqueOrThrow({
    where: { id: attemptId },
    include: { exam: true, answers: { include: { question: true } } },
  });
  if (attempt.status === "GRADED" || attempt.status === "VOIDED") return attempt;

  const allGraded = attempt.answers.every((a) => a.awardedPoints != null);
  if (!allGraded) {
    if (attempt.status !== "GRADING") {
      await db.examAttempt.update({ where: { id: attempt.id }, data: { status: "GRADING" } });
    }
    return attempt;
  }

  const score = attempt.answers.reduce((sum, a) => sum + (a.awardedPoints ?? 0), 0);
  const maxScore = attempt.answers.reduce((sum, a) => sum + a.question.points, 0);
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 1000) / 10 : 0;
  const passed = percentage >= attempt.exam.passingScore;

  const graded = await db.examAttempt.update({
    where: { id: attempt.id },
    data: { status: "GRADED", gradedAt: new Date(), score, maxScore, percentage, passed },
  });

  if (passed) {
    await issueExamCertificate(attempt.id).catch(() => {});
  }
  await db.notification.create({
    data: {
      userId: attempt.userId,
      type: "EXAM",
      title: passed ? "You passed!" : "Exam result available",
      body: `${attempt.exam.title}: ${percentage}% — ${passed ? "Passed" : "Not passed"}.`,
      linkUrl: `/dashboard/exams/${attempt.examId}/attempts/${attempt.id}`,
    },
  });

  const student = await db.user.findUnique({ where: { id: attempt.userId } });
  if (student) {
    await sendEmail({
      to: student.email,
      template: "exam-result",
      subject: `Your result for ${attempt.exam.title}`,
      data: { name: student.name, examTitle: attempt.exam.title, percentage, passed },
    }).catch(() => {});
  }

  return graded;
}
