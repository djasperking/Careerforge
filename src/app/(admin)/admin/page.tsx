import {
  Users, GraduationCap, BadgeCheck, CreditCard, Bot, FileText, ClipboardCheck, Megaphone,
} from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PhaseNotice } from "@/components/ui/phase-notice";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata = { title: "Admin" };

export default async function AdminDashboard() {
  await requireAdmin();

  const since30 = new Date(Date.now() - 30 * 86_400_000);
  const [
    totalUsers, newUsers, activeUsers, enrollments, completions, certificates,
    aiRequests, cvCount, examsCompleted, adImpressions, revenueAgg, recentAudit,
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
  ]);

  return (
    <div>
      <PageHeader title="Admin dashboard" description="Platform activity at a glance." />
      <PhaseNotice phase="Phase 1 — Foundation">
        These metrics are live queries. Charts, date-range filters and full reports are expanded as
        later phases populate the data.
      </PhaseNotice>

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
