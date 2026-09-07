import { requirePermissionPage } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { transfersEnabled } from "@/lib/payments/transfers";
import { PayoutRow } from "./payout-row";

export const metadata = { title: "Payouts" };

export default async function AdminPayoutsPage() {
  await requirePermissionPage("payouts:manage");

  const payouts = await db.payout.findMany({
    orderBy: [{ status: "asc" }, { requestedAt: "desc" }],
    include: { instructor: { select: { name: true, email: true } } },
  });

  const autoEnabled = transfersEnabled();
  const bankCodeByInstructor = autoEnabled
    ? new Map(
        (
          await db.instructorProfile.findMany({
            where: { userId: { in: [...new Set(payouts.map((p) => p.instructorId))] } },
            select: { userId: true, payoutBankCode: true },
          })
        ).map((r) => [r.userId, Boolean(r.payoutBankCode)]),
      )
    : new Map<string, boolean>();

  const pending = payouts.filter((p) => p.status === "REQUESTED" || p.status === "APPROVED");
  const settled = payouts.filter((p) => p.status === "PAID" || p.status === "REJECTED");
  const owedCents = pending.reduce((s, p) => s + p.amountCents, 0);

  const toView = (p: (typeof payouts)[number]) => ({
    id: p.id,
    status: p.status,
    amount: formatCurrency(p.amountCents, p.currency),
    instructorName: p.instructor.name ?? p.instructor.email,
    bankName: p.bankName,
    accountNumber: p.accountNumber,
    accountName: p.accountName,
    note: p.note,
    adminNote: p.adminNote,
    reference: p.reference,
    transferState: p.transferState,
    requestedAt: formatDate(p.requestedAt),
    autoTransfer: autoEnabled && (bankCodeByInstructor.get(p.instructorId) ?? false),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Instructor payouts"
        description="Review payout requests, then transfer the money from your bank / Paystack dashboard and record it here. Funds are never moved automatically."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Awaiting action</p>
          <p className="mt-1 font-display text-xl font-semibold">{pending.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Owed now</p>
          <p className="mt-1 font-display text-xl font-semibold">{formatCurrency(owedCents)}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Paid all-time</p>
          <p className="mt-1 font-display text-xl font-semibold">
            {formatCurrency(payouts.filter((p) => p.status === "PAID").reduce((s, p) => s + p.amountCents, 0))}
          </p>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Needs action</h2>
        {pending.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No payout requests waiting.</CardContent></Card>
        ) : (
          pending.map((p) => <PayoutRow key={p.id} payout={toView(p)} />)
        )}
      </section>

      {settled.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold">History</h2>
          {settled.map((p) => <PayoutRow key={p.id} payout={toView(p)} />)}
        </section>
      ) : null}
    </div>
  );
}
