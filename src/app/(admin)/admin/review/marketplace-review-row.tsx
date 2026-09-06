"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  decideDigitalProductReview,
  setDigitalProductRevenueShare,
  decideCoachingOfferReview,
  setCoachingOfferRevenueShare,
} from "./actions";

type Decision = "APPROVED" | "CHANGES_REQUESTED" | "REJECTED";

/** One row for a digital product or a coaching offer awaiting review. */
export function MarketplaceReviewRow({
  kind,
  id,
  title,
  seller,
  priceLabel,
  meta,
  revenueSharePercent,
  submittedAt,
  previewHref,
}: {
  kind: "product" | "coaching";
  id: string;
  title: string;
  seller: string;
  priceLabel: string;
  meta: string;
  revenueSharePercent: number;
  submittedAt: string;
  previewHref: string | null;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [share, setShare] = useState(revenueSharePercent);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const decideFn = kind === "product" ? decideDigitalProductReview : decideCoachingOfferReview;
  const shareFn = kind === "product" ? setDigitalProductRevenueShare : setCoachingOfferRevenueShare;

  async function decide(decision: Decision) {
    setBusy(decision);
    setError(null);
    if (share !== revenueSharePercent) await shareFn(id, share);
    const res = await decideFn(id, decision, note);
    setBusy(null);
    if (!res.ok) setError(res.error);
    else router.refresh();
  }

  return (
    <div className="rounded-lg border p-4">
      <div>
        {previewHref ? (
          <Link href={previewHref} target="_blank" className="font-medium hover:underline">{title}</Link>
        ) : (
          <span className="font-medium">{title}</span>
        )}
        <p className="text-xs text-muted-foreground">by {seller} · submitted {submittedAt} · {meta}</p>
      </div>

      <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
        <p><span className="text-muted-foreground">Price:</span> {priceLabel}</p>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Seller share:</span>
          <Input
            type="number"
            min={0}
            max={100}
            value={share}
            onChange={(e) => setShare(Math.max(0, Math.min(100, Number(e.target.value))))}
            className="h-8 w-16"
          />
          <span className="text-muted-foreground">%</span>
        </div>
      </div>

      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder="Note to the seller (required to reject or request changes)"
        className="mt-3 flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
      />
      <div className="mt-2 flex flex-wrap gap-2">
        <Button size="sm" disabled={busy !== null} onClick={() => decide("APPROVED")}>
          {busy === "APPROVED" ? "Approving…" : "Approve"}
        </Button>
        <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => decide("CHANGES_REQUESTED")}>
          {busy === "CHANGES_REQUESTED" ? "…" : "Request changes"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-destructive hover:text-destructive"
          disabled={busy !== null}
          onClick={() => decide("REJECTED")}
        >
          {busy === "REJECTED" ? "…" : "Reject"}
        </Button>
      </div>
    </div>
  );
}
