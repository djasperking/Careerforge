import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { StartExamButton } from "./start-exam-button";

export default async function ExamLandingPage({ params }: { params: Promise<{ examId: string }> }) {
  const user = await requireUser();
  const { examId } = await params;

  const exam = await db.exam.findUnique({ where: { id: examId }, include: { course: true } });
  if (!exam || exam.status !== "PUBLISHED") notFound();

  const attempts = await db.examAttempt.findMany({
    where: { examId, userId: user.id },
    orderBy: { attemptNumber: "desc" },
  });
  const inProgress = attempts.find((a) => a.status === "IN_PROGRESS");
  const used = attempts.filter((a) => a.status !== "VOIDED").length;
  const canStart = !inProgress && used < exam.maxAttempts;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={exam.title} description={exam.course?.title} />
      {exam.description ? <p className="mb-6 text-sm text-muted-foreground">{exam.description}</p> : null}

      <Card className="mb-6">
        <CardContent className="grid grid-cols-2 gap-4 p-5 text-sm sm:grid-cols-4">
          <div><p className="text-muted-foreground">Time limit</p><p className="font-medium">{exam.timeLimitMinutes} min</p></div>
          <div><p className="text-muted-foreground">Questions</p><p className="font-medium">{exam.questionCount}</p></div>
          <div><p className="text-muted-foreground">Passing score</p><p className="font-medium">{exam.passingScore}%</p></div>
          <div><p className="text-muted-foreground">Attempts</p><p className="font-medium">{used}/{exam.maxAttempts}</p></div>
        </CardContent>
      </Card>

      {inProgress ? (
        <StartExamButton examId={exam.id} label="Resume attempt" />
      ) : canStart ? (
        <StartExamButton examId={exam.id} label="Start exam" />
      ) : (
        <p className="text-sm text-muted-foreground">You have no attempts remaining for this exam.</p>
      )}

      {attempts.length > 0 ? (
        <div className="mt-8">
          <h2 className="mb-3 font-display text-lg font-semibold">Your attempts</h2>
          <div className="space-y-2">
            {attempts.map((a) => (
              <Link
                key={a.id}
                href={`/dashboard/exams/${exam.id}/attempts/${a.id}`}
                className="flex items-center justify-between rounded-md border p-3 text-sm hover:bg-muted"
              >
                <span>Attempt {a.attemptNumber} · {formatDate(a.startedAt)}</span>
                <span className="flex items-center gap-2">
                  {a.percentage != null ? <span className="font-medium">{Math.round(a.percentage)}%</span> : null}
                  <Badge variant={a.passed ? "success" : a.passed === false ? "destructive" : "secondary"}>{a.status}</Badge>
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
