import { notFound } from "next/navigation";
import Link from "next/link";
import { requirePermissionPage } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, GraduationCap, ClipboardCheck } from "lucide-react";
import { CourseSettingsForm } from "./course-settings-form";
import { ModuleManager } from "./module-manager";
import { CourseStatusControl } from "./course-status-control";

export default async function AdminCourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermissionPage("courses:write");
  const { id } = await params;

  const [course, categories] = await Promise.all([
    db.course.findUnique({
      where: { id },
      include: {
        modules: { include: { lessons: { orderBy: { position: "asc" } } }, orderBy: { position: "asc" } },
        exams: true,
        _count: { select: { enrollments: true } },
      },
    }),
    db.category.findMany({ where: { kind: "course" }, orderBy: { name: "asc" } }),
  ]);
  if (!course) notFound();

  const completedCount = await db.enrollment.count({ where: { courseId: id, status: "COMPLETED" } });

  return (
    <div>
      <PageHeader
        title={course.title}
        description={`/courses/${course.slug}`}
        action={<CourseStatusControl courseId={course.id} status={course.status} />}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Enrollments" value={course._count.enrollments} icon={Users} />
        <StatCard label="Completed" value={completedCount} icon={GraduationCap} />
        <StatCard label="Exams" value={course.exams.length} icon={ClipboardCheck} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Course settings</CardTitle></CardHeader>
          <CardContent>
            <CourseSettingsForm
              courseId={course.id}
              categories={categories.map((c) => ({ id: c.id, name: c.name }))}
              initial={{
                title: course.title,
                description: course.description,
                thumbnailUrl: course.thumbnailUrl ?? "",
                categoryId: course.categoryId ?? "",
                level: course.level,
                durationMinutes: course.durationMinutes,
                priceCents: course.priceCents,
                currency: course.currency,
                requirements: course.requirements.join("\n"),
                objectives: course.objectives.join("\n"),
              }}
            />
          </CardContent>
        </Card>

        <div>
          <Card className="mb-4">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Exams</CardTitle>
              <Button asChild size="sm" variant="outline">
                <Link href={`/admin/exams/new?courseId=${course.id}`}>New exam</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {course.exams.length === 0 ? (
                <p className="text-sm text-muted-foreground">No exams for this course yet.</p>
              ) : (
                <ul className="space-y-1">
                  {course.exams.map((e) => (
                    <li key={e.id}>
                      <Link href={`/admin/exams/${e.id}`} className="text-sm text-primary hover:underline">
                        {e.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Curriculum</CardTitle></CardHeader>
            <CardContent>
              <ModuleManager courseId={course.id} modules={course.modules} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
