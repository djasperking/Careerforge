import { notFound } from "next/navigation";
import { requirePermissionPage } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, ClipboardCheck, ShieldAlert } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { ExamSettingsForm } from "./exam-settings-form";
import { ExamStatusControl } from "./exam-status-control";
import { QuestionManager } from "./question-manager";
import { AiQuestionGenerator } from "./ai-question-generator";
import { GradingQueue } from "./grading-queue";

export default async function AdminExamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermissionPage("exams:write");
  const { id } = await params;

  const [exam, courses] = await Promise.all([
    db.exam.findUnique({
      where: { id },
      include: {
        questions: { include: { options: true }, orderBy: { position: "asc" } },
        _count: { select: { attempts: true } },
      },
    }),
    db.course.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } }),
  ]);
  if (!exam) notFound();

  const [gradingAnswers, securityEvents] = await Promise.all([
    db.examAnswer.findMany({
      where: { question: { examId: id }, awardedPoints: null, attempt: { status: "GRADING" } },
      include: { question: true, attempt: { include: { user: true } } },
      take: 50,
    }),
    db.examSecurityEvent.findMany({
      where: { examId: id },
      include: { attempt: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <div>
      <PageHeader
        title={exam.title}
        description={exam.description ?? undefined}
        action={<ExamStatusControl examId={exam.id} status={exam.status} />}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Attempts" value={exam._count.attempts} icon={Users} />
        <StatCard label="Approved questions" value={exam.questions.filter((q) => q.reviewStatus === "APPROVED").length} icon={ClipboardCheck} />
        <StatCard label="Security events" value={securityEvents.length} icon={ShieldAlert} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Exam settings</CardTitle></CardHeader>
            <CardContent>
              <ExamSettingsForm
                examId={exam.id}
                courses={courses}
                initial={{
                  title: exam.title,
                  description: exam.description ?? "",
                  courseId: exam.courseId ?? "",
                  timeLimitMinutes: exam.timeLimitMinutes,
                  questionCount: exam.questionCount,
                  passingScore: exam.passingScore,
                  maxAttempts: exam.maxAttempts,
                  randomizeQuestions: exam.randomizeQuestions,
                  randomizeOptions: exam.randomizeOptions,
                  gradingMode: exam.gradingMode,
                  revealAnswers: exam.revealAnswers,
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>AI question generator</CardTitle></CardHeader>
            <CardContent>
              <AiQuestionGenerator examId={exam.id} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Manual grading queue</CardTitle></CardHeader>
            <CardContent>
              <GradingQueue
                answers={gradingAnswers.map((a) => ({
                  id: a.id,
                  attemptId: a.attemptId,
                  studentEmail: a.attempt.user.email,
                  prompt: a.question.prompt,
                  textAnswer: a.textAnswer,
                  maxPoints: a.question.points,
                }))}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Exam security events</CardTitle></CardHeader>
            <CardContent>
              {securityEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No suspicious activity recorded.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {securityEvents.map((e) => (
                    <li key={e.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                      <span>
                        <Badge variant="warning" className="mr-2">{e.eventType}</Badge>
                        {e.attempt.user.email}
                      </span>
                      <span className="text-xs text-muted-foreground">{formatDate(e.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Questions</CardTitle></CardHeader>
          <CardContent>
            <QuestionManager
              examId={exam.id}
              questions={exam.questions.map((q) => ({
                id: q.id, type: q.type, prompt: q.prompt, explanation: q.explanation,
                points: q.points, difficulty: q.difficulty, aiGenerated: q.aiGenerated,
                reviewStatus: q.reviewStatus,
                options: q.options.map((o) => ({ id: o.id, text: o.text, isCorrect: o.isCorrect })),
              }))}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
