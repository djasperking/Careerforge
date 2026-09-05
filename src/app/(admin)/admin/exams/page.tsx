import Link from "next/link";
import { requirePermissionPage } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata = { title: "Exams" };

const STATUS_VARIANT: Record<string, "success" | "secondary" | "warning"> = {
  PUBLISHED: "success", DRAFT: "secondary", UNPUBLISHED: "warning", ARCHIVED: "secondary",
};

export default async function AdminExamsPage() {
  await requirePermissionPage("exams:read");
  const exams = await db.exam.findMany({
    include: { course: true, _count: { select: { attempts: true, questions: true } } },
    orderBy: { updatedAt: "desc" },
  });

  const pendingGrading = await db.examAttempt.count({ where: { status: "GRADING" } });

  return (
    <div>
      <PageHeader
        title="Exams"
        description={`${exams.length} exam${exams.length === 1 ? "" : "s"}${pendingGrading ? ` · ${pendingGrading} attempt(s) awaiting manual grading` : ""}`}
        action={
          <Button asChild>
            <Link href="/admin/exams/new">New exam</Link>
          </Button>
        }
      />
      {exams.length === 0 ? (
        <EmptyState title="No exams yet" description="Create your first exam." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {exams.map((e) => (
            <Link key={e.id} href={`/admin/exams/${e.id}`}>
              <Card className="h-full transition-colors hover:border-primary/40">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{e.title}</p>
                    <Badge variant={STATUS_VARIANT[e.status]}>{e.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {e.course?.title ?? "No course"} · {e._count.questions} questions · {e._count.attempts} attempts
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
