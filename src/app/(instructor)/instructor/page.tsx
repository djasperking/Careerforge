import Link from "next/link";
import { BookOpen, Clock, CheckCircle2 } from "lucide-react";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { getInstructorProfile } from "@/lib/instructor/service";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ApplyForm } from "./apply-form";

export const metadata = { title: "Teach on Career Forge" };

const REVIEW_BADGE: Record<string, { label: string; variant: "secondary" | "warning" | "success" | "destructive" }> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  SUBMITTED: { label: "In review", variant: "warning" },
  CHANGES_REQUESTED: { label: "Changes requested", variant: "destructive" },
  APPROVED: { label: "Approved", variant: "success" },
};

export default async function InstructorHome() {
  const user = await requireUser();
  const profile = await getInstructorProfile(user.id);

  if (!profile || profile.status === "REJECTED") {
    return (
      <div>
        <PageHeader
          title="Teach on Career Forge"
          description="Create courses, set your price, and reach learners. Applications are reviewed by our team."
        />
        {profile?.status === "REJECTED" ? (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Your last application wasn&apos;t approved</AlertTitle>
            <AlertDescription>{profile.reviewNote || "You can revise and re-apply below."}</AlertDescription>
          </Alert>
        ) : null}
        <Card>
          <CardHeader><CardTitle>Instructor application</CardTitle></CardHeader>
          <CardContent>
            <ApplyForm
              initial={profile ? { headline: profile.headline, bio: profile.bio, expertise: profile.expertise } : undefined}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (profile.status === "PENDING") {
    return (
      <div>
        <PageHeader title="Application under review" />
        <Alert variant="warning">
          <Clock className="size-4" />
          <AlertTitle>We&apos;re reviewing your application</AlertTitle>
          <AlertDescription>
            You&apos;ll get a notification once it&apos;s decided. This usually takes 1–2 business days.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // APPROVED
  const courses = await db.course.findMany({
    where: { instructorId: user.id },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { enrollments: true } } },
  });
  const submitted = courses.filter((c) => c.reviewStatus === "SUBMITTED").length;

  return (
    <div>
      <PageHeader
        title="Instructor dashboard"
        description="Build a course, then submit it for review before publishing."
        action={
          <Button asChild>
            <Link href="/instructor/courses/new">New course</Link>
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatMini label="Courses" value={courses.length} icon={BookOpen} />
        <StatMini label="Awaiting review" value={submitted} icon={Clock} />
        <StatMini
          label="Total students"
          value={courses.reduce((n, c) => n + c._count.enrollments, 0)}
          icon={CheckCircle2}
        />
      </div>

      <Card>
        <CardHeader><CardTitle>My courses</CardTitle></CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No courses yet. <Link href="/instructor/courses/new" className="text-primary hover:underline">Create your first one.</Link>
            </p>
          ) : (
            <ul className="divide-y">
              {courses.map((c) => {
                const badge = REVIEW_BADGE[c.reviewStatus];
                return (
                  <li key={c.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <Link href={`/instructor/courses/${c.id}`} className="font-medium hover:underline">
                        {c.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {c._count.enrollments} students · {c.status === "PUBLISHED" ? "Live" : "Not live"}
                      </p>
                    </div>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatMini({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <p className="mt-1 font-display text-2xl font-semibold">{value}</p>
    </div>
  );
}
