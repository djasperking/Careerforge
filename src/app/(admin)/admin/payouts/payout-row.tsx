"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { decidePayoutAction } from "./actions";

const BADGE: Record<string, { label: string; variant: "secondary" | "warning" | "success" | "destructive" }> = {
  REQUESTED: { label: "Requested", variant: "warning" },
  APPROVED: { label: "Approved", variant: "success" },
  PAID: { label: "Paid", variant: "secondary" },
  REJECTED: { label: "Rejected", variant: "destructive" },
};

export function PayoutRow({
  payout,
}: {
  payout: {
    id: string;
    status: string;
    amount: string;
    instructorName: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
    note: string | null;
    adminNote: string | null;
    reference: string | null;
    requestedAt: string;
  };
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const badge = BADGE[payout.status];

  async function run(decision: "approve" | "reject" | "mark_paid") {
    if (decision === "reject" && !confirm("Reject this payout? The earnings return to the instructor's available balance.")) return;
    setBusy(true);
    setError(null);
    const res = await decidePayoutAction({
      payoutId: payout.id,
      decision,
      note: note || undefined,
      reference: reference || undefined,
    });
    setBusy(false);
    if (res.ok) router.refresh();
    else setError(res.error);
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg font-semibold">{payout.amount}</p>
          <p className="text-sm text-muted-foreground">
            {payout.instructorName} · requested {payout.requestedAt}
          </p>
        </div>
        <Badge variant={badge.variant}>{badge.label}</Badge>
      </div>

      <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
        <div><dt className="inline text-muted-foreground">Bank: </dt><dd className="inline">{payout.bankName}</dd></div>
        <div><dt className="inline text-muted-foreground">Account: </dt><dd className="inline">{payout.accountNumber}</dd></div>
        <div><dt className="inline text-muted-foreground">Name: </dt><dd className="inline">{payout.accountName}</dd></div>
        {payout.reference ? <div><dt className="inline text-muted-foreground">Transfer ref: </dt><dd className="inline">{payout.reference}</dd></div> : null}
      </dl>
      {payout.note ? <p className="mt-2 text-sm"><span className="text-muted-foreground">Instructor note: </span>{payout.note}</p> : null}
      {payout.adminNote ? <p className="mt-1 text-sm"><span className="text-muted-foreground">Admin note: </span>{payout.adminNote}</p> : null}

      {error ? <Alert variant="destructive" className="mt-3"><AlertDescription>{error}</AlertDescription></Alert> : null}

      {(payout.status === "REQUESTED" || payout.status === "APPROVED") ? (
        <div className="mt-4 space-y-2 border-t pt-4">
          <p className="text-xs text-muted-foreground">
            Send the money from your bank / Paystack dashboard, then record it here. Career Forge does not move funds automatically.
          </p>
          <div className="flex flex-wrap gap-2">
            <Input className="max-w-[220px]" placeholder="Bank transfer reference" value={reference} onChange={(e) => setReference(e.target.value)} />
            <Input className="max-w-[240px]" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            {payout.status === "REQUESTED" ? (
              <Button size="sm" disabled={busy} onClick={() => run("approve")}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : null} Approve
              </Button>
            ) : null}
            <Button size="sm" variant="outline" disabled={busy} onClick={() => run("mark_paid")}>
              Mark as paid
            </Button>
            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" disabled={busy} onClick={() => run("reject")}>
              Reject
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
