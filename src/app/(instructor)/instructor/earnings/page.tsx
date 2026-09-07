import Link from "next/link";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { getInstructorProfile } from "@/lib/instructor/service";
import { getInstructorBalance, listInstructorEarnings, payoutConfig } from "@/lib/earnings/service";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PayoutMethodForm, RequestPayoutButton } from "./earnings-client";

export const metadata = { title: "Earnings" };

const EARNING_BADGE: Record<string, { label: string; variant: "secondary" | "warning" | "success" | "destructive" }> = {
  PENDING: { label: "Clearing", variant: "warning" },
  AVAILABLE: { label: "Available", variant: "success" },
  REVERSED: { label: "Refunded", variant: "destructive" },
  PAID_OUT: { label: "Paid out", variant: "secondary" },
};

const PAYOUT_BADGE: Record<string, { label: string; variant: "secondary" | "warning" | "success" | "destructive" }> = {
  REQUESTED: { label: "Requested", variant: "warning" },
  APPROVED: { label: "Approved", variant: "success" },
  PAID: { label: "Paid", variant: "success" },
  REJECTED: { label: "Rejected", variant: "destructive" },
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold">{value}</p>
    </div>
  );
}

export default async function InstructorEarningsPage() {
  const user = await requireUser();
  const profile = await getInstructorProfile(user.id);

  if (!profile || profile.status !== "APPROVED") {
    return (
      <div>
        <PageHeader title="Earnings" description="Track what you've earned from courses, products and coaching." />
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            You need an approved instructor account first.{" "}
            <Link href="/instructor" className="text-primary hover:underline">Apply to teach</Link>.
          </CardContent>
        </Card>
      </div>
    );
  }

  const [balance, earnings, payouts, cfg] = await Promise.all([
    getInstructorBalance(user.id),
    listInstructorEarnings(user.id),
    db.payout.findMany({ where: { instructorId: user.id }, orderBy: { requestedAt: "desc" } }),
    payoutConfig(),
  ]);

  const cur = earnings[0]?.currency ?? "NGN";
  const hasMethod = Boolean(profile.payoutBankName && profile.payoutAccountNumber && profile.payoutAccountName);
  const openPayout = payouts.find((p) => p.status === "REQUESTED" || p.status === "APPROVED");
  const canRequest = hasMethod && !openPayout && balance.availableCents >= cfg.minimumCents;
  const hint = !hasMethod
    ? "Add your bank details first."
    : openPayout
      ? "You already have a payout in progress."
      : `Minimum payout is ${formatCurrency(cfg.minimumCents, cur)}.`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Earnings"
        description={`Your share of every sale, less the platform fee. Earnings clear ${cfg.holdDays} days after purchase, then you can request a payout.`}
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Available" value={formatCurrency(balance.availableCents, cur)} />
        <Stat label="Clearing" value={formatCurrency(balance.pendingCents, cur)} />
        <Stat label="In payout" value={formatCurrency(balance.inPayoutCents, cur)} />
        <Stat label="Paid out" value={formatCurrency(balance.lifetimeCents, cur)} />
      </div>

      <Card>
        <CardHeader><CardTitle>Request a payout</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <PayoutMethodForm
            initial={{
              bankName: profile.payoutBankName ?? "",
              bankCode: profile.payoutBankCode ?? "",
              accountNumber: profile.payoutAccountNumber ?? "",
              accountName: profile.payoutAccountName ?? "",
            }}
          />
          <div className="border-t pt-4">
            <RequestPayoutButton disabled={!canRequest} hint={hint} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Payout history</CardTitle></CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No payouts yet.</p>
          ) : (
            <ul className="divide-y text-sm">
              {payouts.map((p) => {
                const b = PAYOUT_BADGE[p.status];
                return (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <p className="font-medium">{formatCurrency(p.amountCents, p.currency)}</p>
                      <p className="text-xs text-muted-foreground">
                        Requested {formatDate(p.requestedAt)}
                        {p.paidAt ? ` · Paid ${formatDate(p.paidAt)}` : ""}
                        {p.adminNote ? ` · ${p.adminNote}` : ""}
                      </p>
                    </div>
                    <Badge variant={b.variant}>{b.label}</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Earnings</CardTitle></CardHeader>
        <CardContent>
          {earnings.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No earnings yet. They appear here after someone buys one of your courses, products or coaching sessions.
            </p>
          ) : (
            <ul className="divide-y text-sm">
              {earnings.map((e) => {
                const b = EARNING_BADGE[e.status];
                return (
                  <li key={e.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{e.description ?? e.productType}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(e.createdAt)} · sale {formatCurrency(e.grossCents, e.currency)} · your {e.sharePercent}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(e.netCents, e.currency)}</p>
                      <Badge variant={b.variant}>{b.label}</Badge>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
