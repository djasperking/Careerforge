import Link from "next/link";
import {
  Users, CreditCard, GraduationCap, Bot, ArrowRight, ArrowUpRight, ArrowDownRight,
  UserPlus, ClipboardList, LifeBuoy, RefreshCcw, Banknote, CalendarClock,
  Plus, FilePlus2, Settings as SettingsIcon,
} from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/rbac";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { getAdminOverview } from "@/lib/admin/metrics";

export const metadata = { title: "Admin" };

function Delta({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-muted-foreground">new</span>;
  const up = value >= 0;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium", up ? "text-success" : "text-destructive")}>
      {up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
      {Math.abs(value)}%
    </span>
  );
}

function Kpi({
  label, value, delta, hint, icon: Icon,
}: {
  label: string; value: string; delta?: number | null; hint: string; icon: React.ElementType;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{label}</p>
          <span className="rounded-md bg-primary/10 p-1.5 text-primary"><Icon className="size-4" /></span>
        </div>
        <p className="mt-2 font-display text-2xl font-semibold">{value}</p>
        <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          {delta !== undefined ? <Delta value={delta} /> : null} {hint}
        </p>
      </CardContent>
    </Card>
  );
}

export default async function AdminDashboard() {
  const admin = await requireAdmin();
  const can = (p: Parameters<typeof hasPermission>[1]) => hasPermission(admin.permissions, p);

  const [{ kpis, attention }, recentAudit] = await Promise.all([
    getAdminOverview(),
    db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 10, include: { actor: true } }),
  ]);

  const attentionItems = [
    { label: "Instructor applications", count: attention.pendingInstructors, href: "/admin/review", icon: UserPlus, show: can("instructors:review") },
    { label: "Submissions in review", count: attention.coursesInReview, href: "/admin/review", icon: ClipboardList, show: can("instructors:review") },
    { label: "Payout requests", count: attention.payoutRequests, href: "/admin/payouts", icon: Banknote, show: can("payouts:manage") },
    { label: "Open support tickets", count: attention.openTickets, href: "/admin/support", icon: LifeBuoy, show: can("support:handle") },
    { label: "Payments to reconcile", count: attention.failedTx, href: "/admin/payments", icon: RefreshCcw, show: can("payments:read") },
    { label: "Classes starting soon", count: attention.cohortsSoon, href: "/admin/courses", icon: CalendarClock, show: can("courses:read") },
  ].filter((x) => x.show);

  const quickActions = [
    { label: "New course", href: "/admin/courses", icon: Plus, show: can("courses:write") },
    { label: "New exam", href: "/admin/exams/new", icon: FilePlus2, show: can("exams:write") },
    { label: "Review queue", href: "/admin/review", icon: ClipboardList, show: can("instructors:review") },
    { label: "Analytics", href: "/admin/analytics", icon: ArrowUpRight, show: can("analytics:read") },
    { label: "Settings", href: "/admin/settings", icon: SettingsIcon, show: can("settings:write") },
  ].filter((x) => x.show);

  const openAttention = attentionItems.filter((a) => a.count > 0);

  return (
    <div className="space-y-6">
      <PageHeader title={`Welcome back, ${admin.name?.split(" ")[0] ?? "there"}`} description="Platform health at a glance." />

      {openAttention.length > 0 ? (
        <section>
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">Needs attention</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {openAttention.map((a) => (
              <Link key={a.label} href={a.href} className="group flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:border-primary">
                <div className="flex items-center gap-3">
                  <span className="rounded-md bg-destructive/10 p-2 text-destructive"><a.icon className="size-4" /></span>
                  <div>
                    <p className="font-display text-xl font-semibold">{a.count}</p>
                    <p className="text-xs text-muted-foreground">{a.label}</p>
                  </div>
                </div>
                <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary" />
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">Nothing needs your attention right now.</p>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Revenue" value={formatCurrency(kpis.revenue.value)} delta={kpis.revenue.delta} hint={`${formatCurrency(kpis.revenue.last30)} in 30d`} icon={CreditCard} />
        <Kpi label="Users" value={String(kpis.users.value)} delta={kpis.users.delta} hint={`${kpis.users.last30} new in 30d`} icon={Users} />
        <Kpi label="Enrolments" value={String(kpis.enrollments.value)} delta={kpis.enrollments.delta} hint={`${kpis.enrollments.last30} in 30d`} icon={GraduationCap} />
        <Kpi label="AI requests (30d)" value={String(kpis.ai.last30)} delta={kpis.ai.delta} hint={`${kpis.activeUsers} active users`} icon={Bot} />
      </section>

      {quickActions.length > 0 ? (
        <section className="flex flex-wrap gap-2">
          {quickActions.map((q) => (
            <Link key={q.label} href={q.href} className="inline-flex items-center gap-2 rounded-md border bg-card px-3 py-1.5 text-sm font-medium hover:bg-muted">
              <q.icon className="size-4 text-muted-foreground" /> {q.label}
            </Link>
          ))}
        </section>
      ) : null}

      <Card>
        <CardHeader><CardTitle>Recent activity</CardTitle></CardHeader>
        <CardContent>
          {recentAudit.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No audit records yet.</p>
          ) : (
            <ul className="divide-y">
              {recentAudit.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium">{a.action}</p>
                    <p className="truncate text-muted-foreground">
                      {a.entity}{a.entityId ? ` · ${a.entityId.slice(0, 8)}` : ""} · {a.actor?.email ?? "system"}
                    </p>
                  </div>
                  <span className="shrink-0 text-muted-foreground">{formatDate(a.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
