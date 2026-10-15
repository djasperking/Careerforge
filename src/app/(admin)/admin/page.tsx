import Link from "next/link";
import {
  Users, CreditCard, GraduationCap, Bot, ArrowRight, ArrowUpRight, ArrowDownRight,
  UserPlus, ClipboardList, LifeBuoy, RefreshCcw, Banknote, CalendarClock,
  BookOpen, ClipboardCheck, BadgeCheck, FileText, ScrollText, Mail, Package,
  Megaphone, BarChart3, Briefcase, Settings as SettingsIcon, Wrench, CheckCircle2, History,
} from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import { hasPermission, type PermissionKey } from "@/lib/rbac";
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
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="size-4" /></span>
        {label}
      </div>
      <p className="mt-3 font-display text-3xl font-semibold leading-none">{value}</p>
      <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        {delta !== undefined ? <Delta value={delta} /> : null} {hint}
      </p>
    </div>
  );
}

interface HubTile {
  group: string;
  label: string;
  href: string;
  desc: string;
  icon: React.ElementType;
  permission?: PermissionKey | PermissionKey[];
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
      { group: "learning", label: "Review queue", href: "/admin/review", desc: "Instructor & submission approvals", icon: ClipboardList, permission: ["instructors:review", "submissions:review"] },
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
    { label: "Submissions in review", count: attention.coursesInReview, href: "/admin/review", icon: ClipboardList, show: can("submissions:review") },
    { label: "Payout requests", count: attention.payoutRequests, href: "/admin/payouts", icon: Banknote, show: can("payouts:manage") },
    { label: "Open support tickets", count: attention.openTickets, href: "/admin/support", icon: LifeBuoy, show: can("support:handle") },
    { label: "Payments to reconcile", count: attention.failedTx, href: "/admin/payments", icon: RefreshCcw, show: can("payments:read") },
    { label: "Classes starting soon", count: attention.cohortsSoon, href: "/admin/courses", icon: CalendarClock, show: can("courses:read") },
  ].filter((x) => x.show);

  const openAttention = attentionItems.filter((a) => a.count > 0);

  // Badge counts to overlay on the hub tiles.
  const tileBadges: Record<string, number> = {
    "/admin/review": (can("instructors:review") ? attention.pendingInstructors : 0) + (can("submissions:review") ? attention.coursesInReview : 0),
    "/admin/payouts": attention.payoutRequests,
    "/admin/support": attention.openTickets,
    "/admin/payments": attention.failedTx,
  };

  const hubGroups = HUB_GROUPS.map((g) => ({
    title: g.title,
    tiles: g.tiles.filter((t) => !t.permission || can(t.permission)),
  })).filter((g) => g.tiles.length > 0);

  const today = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  const totalAttention = openAttention.reduce((n, a) => n + a.count, 0);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-br from-violet-800 via-fuchsia-700 to-orange-500 p-6 text-white sm:p-8">
        <p className="text-sm text-white/80">{today}</p>
        <h1 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">Welcome back, {admin.name?.split(" ")[0] ?? "there"}</h1>
        <p className="mt-2 flex items-center gap-2 text-sm text-white/90">
          {totalAttention > 0 ? (
            <>
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold">{totalAttention}</span>
              {totalAttention === 1 ? "thing needs" : "things need"} your attention today.
            </>
          ) : (
            <>
              <CheckCircle2 className="size-4" /> You are all caught up.
            </>
          )}
        </p>
      </section>

      {openAttention.length > 0 ? (
        <section>
          <h2 className="mb-3 font-display text-base font-semibold">Needs attention</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {openAttention.map((a) => (
              <Link key={a.label} href={a.href} className="group flex items-center justify-between rounded-xl border border-destructive/25 bg-destructive/5 p-4 transition hover:border-destructive/60 hover:bg-destructive/10">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-lg bg-destructive/15 text-destructive"><a.icon className="size-5" /></span>
                  <div>
                    <p className="font-display text-2xl font-semibold leading-none">{a.count}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{a.label}</p>
                  </div>
                </div>
                <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-destructive" />
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Revenue" value={formatCurrency(kpis.revenue.value)} delta={kpis.revenue.delta} hint={`${formatCurrency(kpis.revenue.last30)} in 30d`} icon={CreditCard} />
        <Kpi label="Users" value={String(kpis.users.value)} delta={kpis.users.delta} hint={`${kpis.users.last30} new in 30d`} icon={Users} />
        <Kpi label="Enrolments" value={String(kpis.enrollments.value)} delta={kpis.enrollments.delta} hint={`${kpis.enrollments.last30} in 30d`} icon={GraduationCap} />
        <Kpi label="AI requests (30d)" value={String(kpis.ai.last30)} delta={kpis.ai.delta} hint={`${kpis.activeUsers} active users`} icon={Bot} />
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section className="self-start rounded-xl border bg-card">
          <h2 className="flex items-center gap-2 border-b px-5 py-3.5 font-display text-base font-semibold">
            <History className="size-4 text-muted-foreground" /> Recent activity
          </h2>
          {recentAudit.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">No audit records yet.</p>
          ) : (
            <ul className="divide-y">
              {recentAudit.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium">{a.action}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {a.entity}{a.entityId ? ` · ${a.entityId.slice(0, 8)}` : ""} · {a.actor?.email ?? "system"}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatDate(a.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
          {can("audit:read") ? (
            <Link href="/admin/audit" className="block border-t px-5 py-3 text-sm font-medium text-primary hover:underline">
              View all activity →
            </Link>
          ) : null}
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-base font-semibold">Go to</h2>
          {hubGroups.map((g) => (
            <div key={g.title} className="rounded-xl border bg-card">
              <h3 className="border-b px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{g.title}</h3>
              <ul className="p-1.5">
                {g.tiles.map((t) => {
                  const badge = tileBadges[t.href] ?? 0;
                  return (
                    <li key={`${t.group}-${t.label}`}>
                      <Link href={t.href} className="group flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-muted">
                        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                          <t.icon className="size-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium">{t.label}</span>
                          <span className="block truncate text-xs text-muted-foreground">{t.desc}</span>
                        </span>
                        {badge > 0 ? (
                          <span className="rounded-full bg-destructive px-1.5 text-xs font-bold text-destructive-foreground">{badge}</span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
