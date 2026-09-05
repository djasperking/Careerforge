import { requirePermissionPage } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils";
import { PlanEditor } from "./plan-editor";

export const metadata = { title: "Subscriptions" };

export default async function AdminSubscriptionsPage() {
  await requirePermissionPage("subscriptions:write");
  const [plans, activeCount] = await Promise.all([
    db.subscriptionPlan.findMany({ orderBy: { position: "asc" } }),
    db.subscription.count({ where: { status: "ACTIVE" } }),
  ]);

  return (
    <div>
      <PageHeader title="Subscription plans" description={`Plans, pricing and usage limits · ${activeCount} active subscriber(s)`} />
      {plans.length === 0 ? (
        <EmptyState title="No plans yet" description="Run the seed to load Free / Career Plus / Career Pro." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          {plans.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{p.name}</p>
                  <Badge variant={p.isActive ? "success" : "secondary"}>
                    {p.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <p className="mt-1 text-2xl font-semibold">
                  {p.priceCents === 0 ? "Free" : formatCurrency(p.priceCents, p.currency)}
                  {p.priceCents > 0 ? <span className="text-sm font-normal text-muted-foreground">/{p.billingPeriod}</span> : null}
                </p>
                <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  {p.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <PlanEditor
                  planId={p.id}
                  initial={{
                    name: p.name,
                    priceCents: p.priceCents,
                    billingPeriod: p.billingPeriod,
                    features: p.features.join("\n"),
                    isActive: p.isActive,
                  }}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
