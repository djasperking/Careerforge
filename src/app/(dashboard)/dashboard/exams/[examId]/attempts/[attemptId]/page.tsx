import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { deterministicShuffle } from "@/lib/exam/service";
import { submitExamAttempt } from "../../../actions";
import { ExamRunner } from "./exam-runner";
import { ExamResult } from "./exam-result";

export default async function ExamAttemptPage({
  params,
}: {
  params: Promise<{ examId: string; attemptId: string }>;
}) {
  const user = await requireUser();
  const { examId, attemptId } = await params;

  let attempt = await db.examAttempt.findFirst({
    where: { id: attemptId, userId: user.id, examId },
    include: { exam: true, answers: true },
  });
  if (!attempt) notFound();

  // Server-authoritative expiry: if time is up, finalize before rendering.
  if (attempt.status === "IN_PROGRESS" && attempt.serverDeadline < new Date()) {
    await submitExamAttempt(attempt.id);
    attempt = await db.examAttempt.findFirst({
      where: { id: attemptId, userId: user.id, examId },
      include: { exam: true, answers: true },
    });
    if (!attempt) notFound();
  }

  const questions = await db.question.findMany({
    where: { id: { in: attempt.questionIds } },
    include: { options: true },
  });
  const byId = new Map(questions.map((q) => [q.id, q]));
  const ordered = attempt.questionIds.map((id) => byId.get(id)).filter((q): q is NonNullable<typeof q> => !!q);

  if (attempt.status === "IN_PROGRESS") {
    return (
      <ExamRunner
        attemptId={attempt.id}
        examTitle={attempt.exam.title}
        deadlineIso={attempt.serverDeadline.toISOString()}
        questions={ordered.map((q) => ({
          id: q.id,
          type: q.type,
          prompt: q.prompt,
          points: q.points,
          options: (attempt!.exam.randomizeOptions
            ? deterministicShuffle(q.options, `${attempt!.id}:${q.id}`)
            : q.options
          ).map((o) => ({ id: o.id, text: o.text })),
        }))}
        savedAnswers={attempt.answers.map((a) => ({
          questionId: a.questionId,
          selectedOptionIds: a.selectedOptionIds,
          textAnswer: a.textAnswer,
        }))}
      />
    );
  }

  const answersByQuestion = new Map(attempt.answers.map((a) => [a.questionId, a]));
  return (
    <ExamResult
      examId={examId}
      examTitle={attempt.exam.title}
      status={attempt.status}
      percentage={attempt.percentage}
      passed={attempt.passed}
      score={attempt.score}
      maxScore={attempt.maxScore}
      revealAnswers={attempt.exam.revealAnswers}
      answers={ordered.map((q) => {
        const a = answersByQuestion.get(q.id);
        const yourAnswer = a?.textAnswer || (a?.selectedOptionIds ?? []).map((id) => q.options.find((o) => o.id === id)?.text).filter(Boolean).join(", ");
        const correctOptions = q.options.filter((o) => o.isCorrect).map((o) => o.text).join(", ");
        return {
          questionId: q.id,
          prompt: q.prompt,
          points: q.points,
          awardedPoints: a?.awardedPoints ?? null,
          isCorrect: a?.isCorrect ?? null,
          yourAnswer: yourAnswer || "",
          correctAnswer: correctOptions || null,
          explanation: q.explanation,
        };
      })}
    />
  );
}
