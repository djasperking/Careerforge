import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Exams" };

export default async function ExamsPage() {
  const user = await requireUser();

  const [enrollments, attempts] = await Promise.all([
    db.enrollment.findMany({ where: { userId: user.id }, select: { courseId: true } }),
    db.examAttempt.findMany({
      where: { userId: user.id },
      include: { exam: true },
      orderBy: { startedAt: "desc" },
    }),
  ]);

  const courseIds = enrollments.map((e) => e.courseId);
  const availableExams = courseIds.length
    ? await db.exam.findMany({ where: { courseId: { in: courseIds }, status: "PUBLISHED" }, include: { course: true } })
    : [];

  const attemptCountByExam = new Map<string, number>();
  for (const a of attempts) attemptCountByExam.set(a.examId, (attemptCountByExam.get(a.examId) ?? 0) + 1);

  return (
    <div>
      <PageHeader title="Exams" description="Available exams, attempts and results." />

      <Card className="mb-6">
        <CardHeader><CardTitle>Available exams</CardTitle></CardHeader>
        <CardContent>
          {availableExams.length === 0 ? (
            <p className="text-sm text-muted-foreground">Enrol in a course to unlock its exams.</p>
          ) : (
            <div className="space-y-2">
              {availableExams.map((e) => {
                const used = attemptCountByExam.get(e.id) ?? 0;
                const exhausted = used >= e.maxAttempts;
                return (
                  <Link
                    key={e.id}
                    href={`/dashboard/exams/${e.id}`}
                    className="flex items-center justify-between rounded-md border p-3 text-sm hover:bg-muted"
                  >
                    <div>
                      <p className="font-medium">{e.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {e.course?.title} · {e.timeLimitMinutes} min · {used}/{e.maxAttempts} attempts used
                      </p>
                    </div>
                    <Badge variant={exhausted ? "secondary" : "success"}>{exhausted ? "No attempts left" : "Available"}</Badge>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <h2 className="mb-3 font-display text-lg font-semibold">Past attempts</h2>
      {attempts.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="No exam attempts yet" />
      ) : (
        <div className="space-y-3">
          {attempts.map((a) => (
            <Link key={a.id} href={`/dashboard/exams/${a.examId}/attempts/${a.id}`}>
              <Card className="transition-colors hover:border-primary/40">
                <CardContent className="flex items-center justify-between p-5">
                  <div>
                    <p className="font-medium">{a.exam.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Attempt {a.attemptNumber} · {formatDate(a.startedAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    {a.percentage != null ? <p className="font-semibold">{Math.round(a.percentage)}%</p> : null}
                    <Badge variant={a.passed ? "success" : a.passed === false ? "destructive" : "secondary"}>
                      {a.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
