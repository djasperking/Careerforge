import Link from "next/link";
import { requirePermissionPage } from "@/lib/session";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendChart, BarList } from "@/components/ui/mini-chart";
import { formatCurrency } from "@/lib/utils";
import { getAnalytics, rangeDays, RANGES } from "@/lib/admin/metrics";
import { cn } from "@/lib/utils";

export const metadata = { title: "Analytics" };

const PRODUCT_LABEL: Record<string, string> = {
  COURSE: "Courses",
  SUBSCRIPTION: "Subscriptions",
  DIGITAL_PRODUCT: "Digital products",
  COACHING: "Coaching",
  CV_PREMIUM: "CV unlocks",
  AI_PREMIUM: "AI",
  EXAM: "Exams",
  OTHER: "Other",
};

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  await requirePermissionPage("analytics:read");
  const { key, days } = rangeDays((await searchParams).range);
  const a = await getAnalytics(days);

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Growth, revenue and learning activity." />

      <div className="flex gap-2">
        {RANGES.map((r) => (
          <Link
            key={r.key}
            href={`/admin/analytics?range=${r.key}`}
            className={cn(
              "rounded-md border px-3 py-1.5 text-sm font-medium",
              key === r.key ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
            )}
          >
            {r.label}
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-5">
          <p className="text-sm text-muted-foreground">Revenue</p>
          <p className="mt-1 font-display text-2xl font-semibold">{formatCurrency(a.revenueTotal)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <p className="text-sm text-muted-foreground">New signups</p>
          <p className="mt-1 font-display text-2xl font-semibold">{a.signupsTotal}</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <p className="text-sm text-muted-foreground">New enrolments</p>
          <p className="mt-1 font-display text-2xl font-semibold">{a.enrollmentsTotal}</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Revenue</CardTitle></CardHeader>
        <CardContent><TrendChart data={a.revenueSeries} format={(n) => formatCurrency(n)} /></CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>New signups</CardTitle></CardHeader>
          <CardContent><TrendChart data={a.signupSeries} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>New enrolments</CardTitle></CardHeader>
          <CardContent><TrendChart data={a.enrollmentSeries} /></CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Revenue by product</CardTitle></CardHeader>
          <CardContent>
            <BarList
              rows={a.revenueByType.map((r) => ({ label: PRODUCT_LABEL[r.type] ?? r.type, value: r.amount }))}
              format={(n) => formatCurrency(n)}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Top courses</CardTitle></CardHeader>
          <CardContent>
            <BarList rows={a.topCourses.map((c) => ({ label: c.title, value: c.count }))} format={(n) => `${n} enrolled`} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>AI usage by feature</CardTitle></CardHeader>
          <CardContent>
            <BarList rows={a.aiByFeature.map((r) => ({ label: r.feature, value: r.count }))} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
