import Link from "next/link";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AnswerView {
  questionId: string;
  prompt: string;
  points: number;
  awardedPoints: number | null;
  isCorrect: boolean | null;
  yourAnswer: string;
  correctAnswer: string | null;
  explanation: string | null;
}

export function ExamResult({
  examId, examTitle, status, percentage, passed, score, maxScore, revealAnswers, answers,
}: {
  examId: string;
  examTitle: string;
  status: string;
  percentage: number | null;
  passed: boolean | null;
  score: number | null;
  maxScore: number | null;
  revealAnswers: boolean;
  answers: AnswerView[];
}) {
  const pending = status === "GRADING" || status === "SUBMITTED";

  return (
    <div className="mx-auto max-w-2xl">
      <Card className="mb-6">
        <CardContent className="p-6 text-center">
          {pending ? (
            <>
              <Clock className="mx-auto size-10 text-warning" />
              <p className="mt-3 font-display text-xl font-semibold">Grading in progress</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Some answers need manual review. You&apos;ll be notified once your result is final.
              </p>
            </>
          ) : (
            <>
              {passed ? <CheckCircle2 className="mx-auto size-10 text-success" /> : <XCircle className="mx-auto size-10 text-destructive" />}
              <p className="mt-3 font-display text-3xl font-semibold">{percentage}%</p>
              <p className="text-sm text-muted-foreground">{score} / {maxScore} points</p>
              <Badge variant={passed ? "success" : "destructive"} className="mt-2">{passed ? "Passed" : "Not passed"}</Badge>
            </>
          )}
          <div className="mt-4">
            <Button asChild variant="outline" size="sm">
              <Link href={`/dashboard/exams/${examId}`}>Back to exam</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <h2 className="mb-3 font-display text-lg font-semibold">{examTitle} — your answers</h2>
      <div className="space-y-3">
        {answers.map((a, i) => (
          <Card key={a.questionId}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium">{i + 1}. {a.prompt}</p>
                {a.awardedPoints != null ? (
                  <Badge variant={a.isCorrect ? "success" : "destructive"} className="shrink-0">
                    {a.awardedPoints}/{a.points}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="shrink-0">Pending</Badge>
                )}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Your answer: {a.yourAnswer || "—"}</p>
              {revealAnswers && a.correctAnswer ? (
                <p className="mt-1 text-sm text-success">Correct answer: {a.correctAnswer}</p>
              ) : null}
              {revealAnswers && a.explanation ? (
                <p className="mt-1 text-xs text-muted-foreground">{a.explanation}</p>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
