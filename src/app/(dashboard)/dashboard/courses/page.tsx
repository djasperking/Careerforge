import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata = { title: "My Learning" };

export default async function MyCoursesPage() {
  const user = await requireUser();
  const enrollments = await db.enrollment.findMany({
    where: { userId: user.id },
    include: { course: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="My Learning"
        description="Your enrolled courses and progress."
        action={
          <Button asChild variant="outline">
            <Link href="/courses">Browse catalogue</Link>
          </Button>
        }
      />

      {enrollments.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="You haven't enrolled in any courses"
          description="Browse the catalogue to get started."
        />
      ) : (
        <div className="space-y-3">
          {enrollments.map((e) => (
            <Link key={e.id} href={`/dashboard/courses/${e.courseId}`}>
              <Card className="transition-colors hover:border-primary/40">
                <CardContent className="flex items-center justify-between p-5">
                  <div>
                    <p className="font-medium">{e.course.title}</p>
                    <p className="text-sm text-muted-foreground">{e.progressPercent}% complete</p>
                  </div>
                  <Badge variant={e.status === "COMPLETED" ? "success" : "secondary"}>{e.status}</Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
