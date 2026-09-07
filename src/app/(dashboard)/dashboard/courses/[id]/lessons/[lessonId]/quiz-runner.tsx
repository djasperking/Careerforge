"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type LearnerQuiz = {
  id: string;
  title: string;
  passingScore: number;
  maxAttempts: number;
  questions: { id: string; type: string; prompt: string; points: number; options: { id: string; text: string }[] }[];
};

type Result = {
  scorePercent: number;
  passed: boolean;
  attemptsUsed: number;
  attemptsLeft: number | null;
  perQuestion: { questionId: string; correct: boolean; correctOptionIds: string[]; explanation: string | null }[];
};

export function QuizRunner({
  courseId,
  lessonId,
  quiz,
  attempts,
}: {
  courseId: string;
  lessonId: string;
  quiz: LearnerQuiz;
  attempts: { scorePercent: number; passed: boolean; at: string }[];
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const passedBefore = attempts.some((a) => a.passed);
  const usedUp = quiz.maxAttempts > 0 && attempts.length >= quiz.maxAttempts && !passedBefore;

  function pick(qId: string, oId: string, multi: boolean) {
    setAnswers((prev) => {
      const cur = prev[qId] ?? [];
      if (multi) {
        return { ...prev, [qId]: cur.includes(oId) ? cur.filter((x) => x !== oId) : [...cur, oId] };
      }
      return { ...prev, [qId]: [oId] };
    });
  }

  async function submit() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/courses/${courseId}/lessons/${lessonId}/quiz`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ responses: answers }),
    });
    setBusy(false);
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      setError(json?.error?.message || "Could not submit the quiz.");
      return;
    }
    setResult(json.data as Result);
    router.refresh();
  }

  function retry() {
    setResult(null);
    setAnswers({});
  }

  if (passedBefore && !result) {
    const best = Math.max(...attempts.map((a) => a.scorePercent));
    return (
      <div className="rounded-lg border bg-card p-5 text-sm">
        <p className="flex items-center gap-2 font-medium text-success">
          <CheckCircle2 className="size-4" /> Passed · best score {best}%
        </p>
        <p className="mt-1 text-muted-foreground">You&apos;ve already passed this quiz. You can retake it to practise.</p>
        <Button size="sm" variant="outline" className="mt-3" onClick={retry}>
          <RotateCcw className="size-4" /> Retake
        </Button>
      </div>
    );
  }

  if (usedUp && !result) {
    const best = attempts.length ? Math.max(...attempts.map((a) => a.scorePercent)) : 0;
    return (
      <div className="rounded-lg border bg-card p-5 text-sm">
        <p className="flex items-center gap-2 font-medium text-destructive">
          <XCircle className="size-4" /> No attempts left · best score {best}%
        </p>
        <p className="mt-1 text-muted-foreground">
          You&apos;ve used all {quiz.maxAttempts} attempts. Ask your instructor if you need another try.
        </p>
      </div>
    );
  }

  if (result) {
    const byId = new Map(result.perQuestion.map((p) => [p.questionId, p]));
    return (
      <div className="space-y-4">
        <div
          className={cn(
            "rounded-lg border p-5",
            result.passed ? "border-success/40 bg-success/5" : "border-destructive/40 bg-destructive/5",
          )}
        >
          <p className={cn("flex items-center gap-2 text-lg font-semibold", result.passed ? "text-success" : "text-destructive")}>
            {result.passed ? <CheckCircle2 className="size-5" /> : <XCircle className="size-5" />}
            {result.scorePercent}% — {result.passed ? "Passed" : `Not passed (need ${quiz.passingScore}%)`}
          </p>
          {!result.passed ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {result.attemptsLeft === null
                ? "Review the answers below and try again."
                : result.attemptsLeft > 0
                  ? `${result.attemptsLeft} attempt${result.attemptsLeft === 1 ? "" : "s"} left.`
                  : "That was your last attempt."}
            </p>
          ) : null}
        </div>

        {quiz.questions.map((q, i) => {
          const graded = byId.get(q.id);
          const picked = answers[q.id] ?? [];
          return (
            <div key={q.id} className="rounded-lg border bg-card p-4 text-sm">
              <p className="flex items-start gap-2 font-medium">
                {graded?.correct ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                ) : (
                  <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                )}
                <span>
                  {i + 1}. {q.prompt}
                </span>
              </p>
              <ul className="mt-2 space-y-1 pl-6">
                {q.options.map((o) => {
                  const isCorrect = graded?.correctOptionIds.includes(o.id);
                  const chosen = picked.includes(o.id);
                  return (
                    <li
                      key={o.id}
                      className={cn(
                        "rounded px-2 py-1",
                        isCorrect && "bg-success/10 text-success",
                        chosen && !isCorrect && "bg-destructive/10 text-destructive line-through",
                      )}
                    >
                      {o.text}
                      {chosen ? " · your answer" : ""}
                    </li>
                  );
                })}
              </ul>
              {graded?.explanation ? (
                <p className="mt-2 pl-6 text-xs text-muted-foreground">{graded.explanation}</p>
              ) : null}
            </div>
          );
        })}

        {!result.passed && (result.attemptsLeft === null || result.attemptsLeft > 0) ? (
          <Button size="sm" onClick={retry}>
            <RotateCcw className="size-4" /> Try again
          </Button>
        ) : null}
      </div>
    );
  }

  const allAnswered = quiz.questions.every((q) => (answers[q.id] ?? []).length > 0);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4">
        <p className="font-display font-semibold">{quiz.title}</p>
        <p className="text-xs text-muted-foreground">
          Pass mark {quiz.passingScore}% ·{" "}
          {quiz.maxAttempts > 0
            ? `attempt ${attempts.length + 1} of ${quiz.maxAttempts}`
            : "unlimited attempts"}
        </p>
      </div>

      {quiz.questions.map((q, i) => {
        const multi = q.type === "MULTIPLE_ANSWER";
        return (
          <div key={q.id} className="rounded-lg border bg-card p-4 text-sm">
            <p className="font-medium">
              {i + 1}. {q.prompt} {multi ? <span className="text-xs text-muted-foreground">(select all that apply)</span> : null}
            </p>
            <div className="mt-2 space-y-1.5">
              {q.options.map((o) => {
                const chosen = (answers[q.id] ?? []).includes(o.id);
                return (
                  <label
                    key={o.id}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-md border p-2",
                      chosen ? "border-primary bg-primary/5" : "hover:bg-muted",
                    )}
                  >
                    <input
                      type={multi ? "checkbox" : "radio"}
                      name={q.id}
                      checked={chosen}
                      onChange={() => pick(q.id, o.id, multi)}
                      className="size-4"
                    />
                    {o.text}
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button onClick={submit} disabled={busy || !allAnswered}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : null}
        {allAnswered ? "Submit quiz" : "Answer every question to submit"}
      </Button>
    </div>
  );
}
