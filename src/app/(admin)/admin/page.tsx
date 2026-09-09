import Link from "next/link";
import {
  Users, CreditCard, GraduationCap, Bot, ArrowRight, ArrowUpRight, ArrowDownRight,
  UserPlus, ClipboardList, LifeBuoy, RefreshCcw, Banknote, CalendarClock,
  BookOpen, ClipboardCheck, BadgeCheck, FileText, ScrollText, Mail, Package,
  Megaphone, BarChart3, Briefcase, Settings as SettingsIcon, Wrench,
} from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import { hasPermission, type PermissionKey } from "@/lib/rbac";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { getAdminOverview } from "@/lib/admin/metrics";
import { AdminPanels } from "./admin-panels";

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

interface HubTile {
  group: string;
  label: string;
  href: string;
  desc: string;
  icon: React.ElementType;
  permission?: PermissionKey;
}

const HUB_GROUPS: { title: string; tiles: HubTile[] }[] = [
  {
    title: "Learning & content",
    tiles: [
      { group: "learning", label: "Courses", href: "/admin/courses", desc: "Publish, review and manage cohorts", icon: BookOpen, permission: "courses:read" },
      { group: "learning", label: "Exams", href: "/admin/exams", desc: "Question banks & exam-prep products", icon: ClipboardCheck, permission: "exams:read" },
      { group: "learning", label: "Certificates", href: "/admin/certificates", desc: "Issued certificates & templates", icon: BadgeCheck, permission: "courses:read" },
      { group: "learning", label: "CV Templates", href: "/admin/cv-templates", desc: "Layouts, accents & premium flags", icon: FileText, permission: "cv:templates" },
      { group: "learning", label: "AI configuration", href: "/admin/ai", desc: "Provider, models & usage limits", icon: Bot, permission: "ai:config" },
      { group: "learning", label: "Blog", href: "/admin/content", desc: "Posts, drafts & SEO", icon: ScrollText, permission: "content:write" },
      { group: "learning", label: "Digital products", href: "/instructor/products", desc: "Instructor-sold downloads", icon: Package, permission: "courses:write" },
      { group: "learning", label: "Review queue", href: "/admin/review", desc: "Instructor & submission approvals", icon: ClipboardList, permission: "instructors:review" },
    ],
  },
  {
    title: "Money",
    tiles: [
      { group: "money", label: "Payments", href: "/admin/payments", desc: "Transactions & reconciliation", icon: CreditCard, permission: "payments:read" },
      { group: "money", label: "Payouts", href: "/admin/payouts", desc: "Instructor withdrawal requests", icon: Banknote, permission: "payouts:manage" },
      { group: "money", label: "Subscriptions", href: "/admin/subscriptions", desc: "Plans, pricing, CV & AI limits", icon: CreditCard, permission: "subscriptions:write" },
    ],
  },
  {
    title: "Growth",
    tiles: [
      { group: "growth", label: "Analytics", href: "/admin/analytics", desc: "Funnels, revenue & retention", icon: BarChart3, permission: "analytics:read" },
      { group: "growth", label: "Jobs board", href: "/admin/jobs", desc: "Listings & applications", icon: Briefcase, permission: "jobs:write" },
      { group: "growth", label: "Advertisements", href: "/admin/ads", desc: "Placements & campaigns", icon: Megaphone, permission: "ads:write" },
      { group: "growth", label: "Newsletter", href: "/admin/newsletter", desc: "Broadcasts & subscribers", icon: Mail, permission: "content:write" },
    ],
  },
  {
    title: "People & system",
    tiles: [
      { group: "system", label: "Users", href: "/admin/users", desc: "Accounts, roles, verification", icon: Users, permission: "users:read" },
      { group: "system", label: "Support", href: "/admin/support", desc: "Tickets & conversations", icon: LifeBuoy, permission: "support:handle" },
      { group: "system", label: "Audit logs", href: "/admin/audit", desc: "Every staff action, searchable", icon: ScrollText, permission: "audit:read" },
      { group: "system", label: "Settings", href: "/admin/settings", desc: "Branding, pricing, integrations", icon: SettingsIcon, permission: "settings:write" },
      { group: "system", label: "Maintenance mode", href: "/admin/maintenance", desc: "Per-section maintenance toggles", icon: Wrench, permission: "settings:write" },
    ],
  },
];

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

  const openAttention = attentionItems.filter((a) => a.count > 0);

  // Badge counts to overlay on the hub tiles.
  const tileBadges: Record<string, number> = {
    "/admin/review": attention.pendingInstructors + attention.coursesInReview,
    "/admin/payouts": attention.payoutRequests,
    "/admin/support": attention.openTickets,
    "/admin/payments": attention.failedTx,
  };

  const hubGroups = HUB_GROUPS.map((g) => ({
    title: g.title,
    tiles: g.tiles.filter((t) => !t.permission || can(t.permission)),
  })).filter((g) => g.tiles.length > 0);

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

      <AdminPanels
        hub={
          <div className="space-y-6">
            {hubGroups.map((g) => (
              <div key={g.title}>
                <h3 className="mb-3 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  {g.title}
                  <span className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {g.tiles.map((t) => {
                    const badge = tileBadges[t.href] ?? 0;
                    return (
                      <Link
                        key={`${t.group}-${t.label}`}
                        href={t.href}
                        className={cn(
                          "group relative flex flex-col gap-2 overflow-hidden rounded-xl border border-primary/15 bg-card p-4",
                          "shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-150",
                          "hover:-translate-y-0.5 hover:border-primary hover:shadow-[0_8px_24px_-6px_hsl(var(--cf-primary)/0.35)]",
                        )}
                      >
                        <span
                          aria-hidden
                          className="pointer-events-none absolute -right-6 -top-6 size-16 rounded-full bg-primary/10 blur-xl transition-opacity group-hover:bg-primary/25"
                        />
                        <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                          <t.icon className="size-4" />
                        </span>
                        <span className="flex items-center gap-2 text-sm font-semibold">
                          {t.label}
                          {badge > 0 ? (
                            <span className="rounded-full bg-destructive px-1.5 text-xs font-bold text-destructive-foreground">
                              {badge}
                            </span>
                          ) : null}
                        </span>
                        <span className="text-xs leading-snug text-muted-foreground">{t.desc}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        }
        recent={
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
        }
      />
    </div>
  );
}
