import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/email";
import { getInstructorProfile } from "@/lib/instructor/service";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ModuleManager } from "@/app/(admin)/admin/courses/[id]/module-manager";
import { InstructorCourseSettings } from "./course-settings";
import { CourseReviewPanel } from "./review-panel";
import { SharePanel } from "@/components/ui/share-panel";

export default async function InstructorCourseEditor({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const profile = await getInstructorProfile(user.id);
  if (!profile || profile.status !== "APPROVED") redirect("/instructor");

  const { id } = await params;
  const [course, categories] = await Promise.all([
    db.course.findFirst({
      where: { id, instructorId: user.id },
      include: {
        modules: { include: { lessons: { orderBy: { position: "asc" } } }, orderBy: { position: "asc" } },
        _count: { select: { enrollments: true } },
      },
    }),
    db.category.findMany({ where: { kind: "course" }, orderBy: { name: "asc" } }),
  ]);
  if (!course) notFound();

  const locked = course.reviewStatus === "SUBMITTED";

  return (
    <div>
      <PageHeader
        title={course.title}
        description={`${course._count.enrollments} students · ${course.status === "PUBLISHED" ? "Live" : "Not live"}`}
      />

      <CourseReviewPanel
        courseId={course.id}
        reviewStatus={course.reviewStatus}
        publishStatus={course.status}
        reviewNote={course.reviewNote}
        revenueSharePercent={course.revenueSharePercent}
      />

      {locked ? (
        <Alert variant="warning" className="mb-6">
          <AlertTitle>This course is awaiting review</AlertTitle>
          <AlertDescription>You can&apos;t edit it until a decision is made.</AlertDescription>
        </Alert>
      ) : null}

      {course.status === "PUBLISHED" ? (
        <Card className="mb-6">
          <CardHeader><CardTitle>Share your course</CardTitle></CardHeader>
          <CardContent>
            <SharePanel
              url={appUrl(`/courses/${course.slug}`)}
              intro="Your course is live. Share this link anywhere — anyone who opens it can sign up and enrol."
              shareText={`Check out my course "${course.title}" on Career Forge`}
            />
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Course settings</CardTitle></CardHeader>
          <CardContent>
            <InstructorCourseSettings
              courseId={course.id}
              locked={locked}
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
                discountPercent: course.discountPercent ?? 0,
                discountEndsAt: course.discountEndsAt ? course.discountEndsAt.toISOString().slice(0, 10) : "",
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Curriculum</CardTitle></CardHeader>
          <CardContent>
            {locked ? (
              <ReadOnlyCurriculum modules={course.modules} />
            ) : (
              <ModuleManager courseId={course.id} modules={course.modules} />
            )}
          </CardContent>
        </Card>
      </div>

      <p className="mt-6 text-sm">
        <Link href="/instructor" className="text-primary hover:underline">← Back to instructor dashboard</Link>
      </p>
    </div>
  );
}

function ReadOnlyCurriculum({ modules }: { modules: { id: string; title: string; lessons: { id: string; title: string }[] }[] }) {
  if (modules.length === 0) return <p className="text-sm text-muted-foreground">No modules.</p>;
  return (
    <ul className="space-y-2 text-sm">
      {modules.map((m) => (
        <li key={m.id}>
          <p className="font-medium">{m.title}</p>
          <ul className="ml-4 list-disc text-muted-foreground">
            {m.lessons.map((l) => <li key={l.id}>{l.title}</li>)}
          </ul>
        </li>
      ))}
    </ul>
  );
}
