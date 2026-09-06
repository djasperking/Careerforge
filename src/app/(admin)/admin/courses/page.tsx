import Link from "next/link";
import { requirePermissionPage } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CourseThumb } from "@/components/ui/course-thumb";
import { formatCurrency, formatDate } from "@/lib/utils";
import { NewCourseControl } from "./new-course-control";

export const metadata = { title: "Courses" };

const STATUS_VARIANT: Record<string, "success" | "secondary" | "warning"> = {
  PUBLISHED: "success",
  DRAFT: "secondary",
  UNPUBLISHED: "warning",
  ARCHIVED: "secondary",
};

export default async function AdminCoursesPage() {
  await requirePermissionPage("courses:read");
  const courses = await db.course.findMany({
    include: { category: true, _count: { select: { enrollments: true, modules: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="Courses" description={`${courses.length} course${courses.length === 1 ? "" : "s"}`} action={<NewCourseControl />} />
      {courses.length === 0 ? (
        <EmptyState title="No courses yet" description="Create your first course to get started." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <Link key={c.id} href={`/admin/courses/${c.id}`}>
              <Card className="h-full overflow-hidden transition-colors hover:border-primary/40">
                <CourseThumb src={c.thumbnailUrl} alt={c.title} className="rounded-none border-0 border-b" />
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{c.title}</p>
                    <Badge variant={STATUS_VARIANT[c.status]}>{c.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {c.category?.name ?? "Uncategorised"} · {c._count.modules} modules · {c._count.enrollments} enrolled
                  </p>
                  <p className="mt-2 text-sm font-medium">
                    {c.priceCents === 0 ? "Free" : formatCurrency(c.priceCents, c.currency)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Updated {formatDate(c.updatedAt)}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
