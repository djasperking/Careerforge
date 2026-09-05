import { requirePermissionPage, getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/rbac";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { RefundButton } from "./refund-button";

export const metadata = { title: "Payments" };

const STATUS_VARIANT: Record<string, "success" | "destructive" | "secondary" | "warning"> = {
  SUCCESS: "success", FAILED: "destructive", VERIFICATION_FAILED: "destructive",
  REFUNDED: "warning", PENDING: "secondary", ABANDONED: "secondary",
};

export default async function AdminPaymentsPage() {
  await requirePermissionPage("payments:read");
  const me = await getCurrentUser();
  const canRefund = hasPermission(me?.permissions, "payments:refund");

  const [success, failed, revenue, recent, webhookEvents] = await Promise.all([
    db.transaction.count({ where: { status: "SUCCESS" } }),
    db.transaction.count({ where: { status: { in: ["FAILED", "VERIFICATION_FAILED"] } } }),
    db.transaction.aggregate({ _sum: { amountCents: true }, where: { status: "SUCCESS" } }),
    db.transaction.findMany({ orderBy: { createdAt: "desc" }, take: 25, include: { user: true } }),
    db.paymentWebhookEvent.findMany({ orderBy: { createdAt: "desc" }, take: 15 }),
  ]);

  return (
    <div>
      <PageHeader title="Payments" description="Transactions and reconciliation." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Successful payments" value={success} />
        <StatCard label="Failed payments" value={failed} />
        <StatCard label="Total revenue" value={formatCurrency(revenue._sum.amountCents ?? 0)} />
      </div>

      <Card className="mt-6">
        <CardContent className="p-0">
          {recent.length === 0 ? (
            <EmptyState title="No transactions yet" className="m-6" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{formatDate(t.createdAt)}</TableCell>
                    <TableCell>{t.user.email}</TableCell>
                    <TableCell>{t.description ?? t.productType}</TableCell>
                    <TableCell>{formatCurrency(t.amountCents, t.currency)}</TableCell>
                    <TableCell><Badge variant={STATUS_VARIANT[t.status] ?? "secondary"}>{t.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      {canRefund && t.status === "SUCCESS" ? <RefundButton transactionId={t.id} /> : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader><CardTitle>Webhook events</CardTitle></CardHeader>
        <CardContent className="p-0">
          {webhookEvents.length === 0 ? (
            <EmptyState title="No webhook events received yet" className="m-6" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Received</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Processed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhookEvents.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{formatDate(e.createdAt, { hour: "2-digit", minute: "2-digit" })}</TableCell>
                    <TableCell className="capitalize">{e.provider}</TableCell>
                    <TableCell>{e.eventType}</TableCell>
                    <TableCell>
                      <Badge variant={e.processedAt ? "success" : "secondary"}>{e.processedAt ? "Processed" : "Pending"}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
