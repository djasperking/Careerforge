import Link from "next/link";
import {
  Users, GraduationCap, BadgeCheck, CreditCard, Bot, FileText, ClipboardCheck, Megaphone,
  ClipboardList, UserPlus, LifeBuoy, RefreshCcw, ArrowRight,
} from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/rbac";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata = { title: "Admin" };

export default async function AdminDashboard() {
  const admin = await requireAdmin();
  const canReview = hasPermission(admin.permissions, "instructors:review");
  const canSupport = hasPermission(admin.permissions, "support:handle");
  const canRefund = hasPermission(admin.permissions, "payments:refund") || hasPermission(admin.permissions, "payments:read");

  const since30 = new Date(Date.now() - 30 * 86_400_000);
  const [
    totalUsers, newUsers, activeUsers, enrollments, completions, certificates,
    aiRequests, cvCount, examsCompleted, adImpressions, revenueAgg, recentAudit,
    pendingInstructors, coursesInReview, openTickets, disputedTx,
  ] = await Promise.all([
    db.user.count({ where: { deletedAt: null } }),
    db.user.count({ where: { createdAt: { gte: since30 } } }),
    db.user.count({ where: { lastLoginAt: { gte: since30 } } }),
    db.enrollment.count(),
    db.enrollment.count({ where: { status: "COMPLETED" } }),
    db.certificate.count({ where: { revokedAt: null } }),
    db.aIRequest.count({ where: { createdAt: { gte: since30 } } }),
    db.cV.count({ where: { deletedAt: null } }),
    db.examAttempt.count({ where: { status: "GRADED" } }),
    db.adImpression.count({ where: { createdAt: { gte: since30 } } }),
    db.transaction.aggregate({ _sum: { amountCents: true }, where: { status: "SUCCESS" } }),
    db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { actor: true } }),
    db.instructorProfile.count({ where: { status: "PENDING" } }),
    db.course.count({ where: { reviewStatus: "SUBMITTED" } }),
    db.supportTicket.count({ where: { status: { in: ["OPEN", "PENDING"] } } }),
    db.transaction.count({ where: { status: "VERIFICATION_FAILED" } }),
  ]);

  const attention: { label: string; count: number; href: string; icon: React.ElementType; show: boolean }[] = [
    { label: "Instructor applications", count: pendingInstructors, href: "/admin/review", icon: UserPlus, show: canReview },
    { label: "Courses awaiting review", count: coursesInReview, href: "/admin/review", icon: ClipboardList, show: canReview },
    { label: "Open support tickets", count: openTickets, href: "/admin/support", icon: LifeBuoy, show: canSupport },
    { label: "Payments to reconcile", count: disputedTx, href: "/admin/payments", icon: RefreshCcw, show: canRefund },
  ].filter((x) => x.show);

  return (
    <div>
      <PageHeader title="Admin dashboard" description="What needs your attention, and platform activity." />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {attention.map((a) => (
          <Link
            key={a.label}
            href={a.href}
            className="group flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:border-primary"
          >
            <div>
              <p className="text-sm text-muted-foreground">{a.label}</p>
              <p className={`mt-1 font-display text-2xl font-semibold ${a.count > 0 ? "text-foreground" : "text-muted-foreground"}`}>
                {a.count}
              </p>
            </div>
            {a.count > 0 ? (
              <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary" />
            ) : (
              <a.icon className="size-4 text-muted-foreground" />
            )}
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total users" value={totalUsers} hint={`${newUsers} new in 30d`} icon={Users} />
        <StatCard label="Active users (30d)" value={activeUsers} icon={Users} />
        <StatCard
          label="Revenue (all time)"
          value={formatCurrency(revenueAgg._sum.amountCents ?? 0)}
          icon={CreditCard}
        />
        <StatCard label="Course enrollments" value={enrollments} hint={`${completions} completed`} icon={GraduationCap} />
        <StatCard label="Certificates issued" value={certificates} icon={BadgeCheck} />
        <StatCard label="CVs created" value={cvCount} icon={FileText} />
        <StatCard label="Exams completed" value={examsCompleted} icon={ClipboardCheck} />
        <StatCard label="AI requests (30d)" value={aiRequests} icon={Bot} />
        <StatCard label="Ad impressions (30d)" value={adImpressions} icon={Megaphone} />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentAudit.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No audit records yet.</p>
          ) : (
            <ul className="divide-y">
              {recentAudit.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium">{a.action}</p>
                    <p className="text-muted-foreground">
                      {a.entity}
                      {a.entityId ? ` · ${a.entityId.slice(0, 8)}` : ""} ·{" "}
                      {a.actor?.email ?? "system"}
                    </p>
                  </div>
                  <span className="text-muted-foreground">{formatDate(a.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
