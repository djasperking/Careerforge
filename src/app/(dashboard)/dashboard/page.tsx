import Link from "next/link";
import { FileText, GraduationCap, BadgeCheck, CreditCard, ArrowRight, Bell } from "lucide-react";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CourseThumb } from "@/components/ui/course-thumb";
import { ResendVerification } from "@/components/auth/resend-verification";
import { AdSlot } from "@/components/ads/ad-slot";
import { formatDate } from "@/lib/utils";

export default async function DashboardHome() {
  const user = await requireUser();

  const [cvCount, enrollments, certificates, recentTx, notifications, profile] = await Promise.all([
    db.cV.count({ where: { userId: user.id, deletedAt: null } }),
    db.enrollment.findMany({
      where: { userId: user.id },
      include: { course: true },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    db.certificate.count({ where: { userId: user.id, revokedAt: null } }),
    db.transaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.notification.findMany({
      where: { userId: user.id, readAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.profile.findUnique({ where: { userId: user.id } }),
  ]);

  const activeCourses = enrollments.filter((e) => e.status === "ACTIVE").length;

  return (
    <div>
      <PageHeader
        title={`Welcome back${user.name ? `, ${user.name.split(" ")[0]}` : ""}`}
        description="Here's an overview of your career activity."
      />

      {!user.emailIsVerified ? (
        <Alert variant="warning" className="mb-6">
          <AlertDescription>
            <ResendVerification />
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Profile complete" value={`${profile?.completionPercent ?? 0}%`} icon={FileText} href="/dashboard/profile" />
        <StatCard label="My CVs" value={cvCount} icon={FileText} href="/dashboard/cvs" />
        <StatCard label="Active courses" value={activeCourses} icon={GraduationCap} href="/dashboard/courses" />
        <StatCard label="Certificates" value={certificates} icon={BadgeCheck} href="/dashboard/certificates" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Continue learning</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/courses">
                View all <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {enrollments.length === 0 ? (
              <EmptyState
                icon={GraduationCap}
                title="No courses yet"
                description="Explore the catalogue and enrol in your first course."
                action={
                  <Button asChild size="sm">
                    <Link href="/courses">Browse courses</Link>
                  </Button>
                }
              />
            ) : (
              <ul className="divide-y">
                {enrollments.map((e) => (
                  <li key={e.id} className="flex items-center gap-3 py-3">
                    <CourseThumb src={e.course.thumbnailUrl} alt={e.course.title} className="w-20 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{e.course.title}</p>
                      <p className="text-sm text-muted-foreground">{e.progressPercent}% complete</p>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/dashboard/courses/${e.courseId}`}>Continue</Link>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Notifications</CardTitle>
            <Bell className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">You&apos;re all caught up.</p>
            ) : (
              <ul className="space-y-3">
                {notifications.map((n) => (
                  <li key={n.id} className="text-sm">
                    <p className="font-medium">{n.title}</p>
                    <p className="text-muted-foreground">{n.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <AdSlot placement="DASHBOARD" path="/dashboard" />
      </div>

      <Card className="mt-6">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Recent transactions</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/payments">
              View all <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentTx.length === 0 ? (
            <EmptyState icon={CreditCard} title="No transactions yet" />
          ) : (
            <ul className="divide-y">
              {recentTx.map((t) => (
                <li key={t.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium">{t.description ?? t.productType}</p>
                    <p className="text-muted-foreground">{formatDate(t.createdAt)}</p>
                  </div>
                  <span className="text-muted-foreground">{t.status}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
