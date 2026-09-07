import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getInstructorProfile } from "@/lib/instructor/service";
import { getInstructorAnalytics } from "@/lib/instructor/analytics";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendChart, BarList } from "@/components/ui/mini-chart";
import { formatCurrency, cn } from "@/lib/utils";

export const metadata = { title: "Sales analytics" };

const RANGES = [
  { key: "7d", label: "7 days", days: 7 },
  { key: "30d", label: "30 days", days: 30 },
  { key: "90d", label: "90 days", days: 90 },
];

const TYPE_LABEL: Record<string, string> = {
  COURSE: "Courses",
  DIGITAL_PRODUCT: "Digital products",
  COACHING: "Coaching",
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold">{value}</p>
    </div>
  );
}

export default async function InstructorAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const user = await requireUser();
  const profile = await getInstructorProfile(user.id);
  if (!profile || profile.status !== "APPROVED") {
    return (
      <div>
        <PageHeader title="Sales analytics" description="Revenue, sales and students over time." />
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
          You need an approved instructor account first.{" "}
          <Link href="/instructor" className="text-primary hover:underline">Apply to teach</Link>.
        </CardContent></Card>
      </div>
    );
  }

  const sp = await searchParams;
  const range = RANGES.find((r) => r.key === sp.range) ?? RANGES[1];
  const a = await getInstructorAnalytics(user.id, range.days);

  return (
    <div className="space-y-6">
      <PageHeader title="Sales analytics" description="Your revenue, sales and students. Payouts live on the Earnings page." />

      <div className="flex gap-2">
        {RANGES.map((r) => (
          <Link
            key={r.key}
            href={`/instructor/analytics?range=${r.key}`}
            className={cn(
              "rounded-md border px-3 py-1.5 text-sm font-medium",
              r.key === range.key ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
            )}
          >
            {r.label}
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label={`Gross · ${range.label}`} value={formatCurrency(a.periodGross)} />
        <Stat label={`Your share · ${range.label}`} value={formatCurrency(a.periodNet)} />
        <Stat label={`Sales · ${range.label}`} value={String(a.periodSales)} />
        <Stat label="Students all-time" value={String(a.lifetime.students)} />
      </div>

      <Card>
        <CardHeader><CardTitle>Revenue (gross)</CardTitle></CardHeader>
        <CardContent><TrendChart data={a.revenueSeries} format={(n) => formatCurrency(n)} /></CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Sales</CardTitle></CardHeader>
          <CardContent><TrendChart data={a.salesSeries} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>New enrolments</CardTitle></CardHeader>
          <CardContent><TrendChart data={a.enrolmentSeries} /></CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Revenue by type</CardTitle></CardHeader>
          <CardContent>
            <BarList
              rows={a.revenueByType.map((r) => ({ label: TYPE_LABEL[r.type] ?? r.type, value: r.amount }))}
              format={(n) => formatCurrency(n)}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Top sellers</CardTitle></CardHeader>
          <CardContent>
            <BarList
              rows={a.topItems.map((i) => ({ label: i.label, value: i.gross }))}
              format={(n) => formatCurrency(n)}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
