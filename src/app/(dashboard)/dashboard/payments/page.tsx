import Link from "next/link";
import { CreditCard } from "lucide-react";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { UpgradePlanControl } from "./upgrade-plan-control";

export const metadata = { title: "Payments" };

const STATUS_VARIANT: Record<string, "success" | "destructive" | "secondary" | "warning"> = {
  SUCCESS: "success",
  FAILED: "destructive",
  VERIFICATION_FAILED: "destructive",
  REFUNDED: "warning",
  PENDING: "secondary",
  ABANDONED: "secondary",
};

export default async function PaymentsPage() {
  const user = await requireUser();
  const [transactions, subscriptions, plans] = await Promise.all([
    db.transaction.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    db.subscription.findMany({ where: { userId: user.id, status: "ACTIVE" }, include: { plan: true } }),
    db.subscriptionPlan.findMany({ where: { isActive: true, priceCents: { gt: 0 } }, orderBy: { position: "asc" } }),
  ]);

  const activePlanId = subscriptions[0]?.planId;

  return (
    <div>
      <PageHeader title="Payments" description="Transactions, subscriptions and receipts." />

      <h2 className="mb-3 font-display text-lg font-semibold">Subscription</h2>
      {subscriptions.length === 0 ? (
        <p className="mb-4 text-sm text-muted-foreground">You&apos;re on the Free plan.</p>
      ) : (
        <div className="mb-4 space-y-2">
          {subscriptions.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-md border p-4">
              <div>
                <p className="font-medium">{s.plan.name}</p>
                <p className="text-sm text-muted-foreground">Renews {formatDate(s.currentPeriodEnd)}</p>
              </div>
              <Badge variant="success">{s.status}</Badge>
            </div>
          ))}
        </div>
      )}

      {plans.filter((p) => p.id !== activePlanId).length > 0 ? (
        <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {plans.filter((p) => p.id !== activePlanId).map((p) => (
            <Card key={p.id}>
              <CardContent className="p-4">
                <p className="font-medium">{p.name}</p>
                <p className="mt-1 text-xl font-semibold">
                  {formatCurrency(p.priceCents, p.currency)}
                  <span className="text-sm font-normal text-muted-foreground">/{p.billingPeriod}</span>
                </p>
                <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                  {p.features.slice(0, 3).map((f) => <li key={f}>• {f}</li>)}
                </ul>
                <div className="mt-3">
                  <UpgradePlanControl planId={p.id} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      <h2 className="mb-3 font-display text-lg font-semibold">Transactions</h2>
      {transactions.length === 0 ? (
        <EmptyState icon={CreditCard} title="No transactions yet" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{formatDate(t.createdAt)}</TableCell>
                <TableCell>{t.description ?? t.productType}</TableCell>
                <TableCell>{formatCurrency(t.amountCents, t.currency)}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[t.status] ?? "secondary"}>{t.status}</Badge>
                </TableCell>
                <TableCell>
                  {t.status === "SUCCESS" ? (
                    <Link href={`/dashboard/payments/${t.id}`} className="text-sm text-primary hover:underline">
                      Receipt
                    </Link>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
