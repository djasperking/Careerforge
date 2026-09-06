"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { submitProductForReview, reopenMyProduct, setMyProductPublished } from "../actions";

const BADGE: Record<string, { label: string; variant: "secondary" | "warning" | "success" | "destructive" }> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  SUBMITTED: { label: "In review", variant: "warning" },
  CHANGES_REQUESTED: { label: "Changes requested", variant: "destructive" },
  APPROVED: { label: "Approved", variant: "success" },
};

export function ProductReviewPanel({
  productId,
  reviewStatus,
  publishStatus,
  reviewNote,
  revenueSharePercent,
  shareUrl,
}: {
  productId: string;
  reviewStatus: "DRAFT" | "SUBMITTED" | "CHANGES_REQUESTED" | "APPROVED";
  publishStatus: string;
  reviewNote: string | null;
  revenueSharePercent: number;
  shareUrl: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setBusy(true);
    setError(null);
    const res = await fn();
    setBusy(false);
    if (!res.ok) setError(res.error ?? "Something went wrong.");
    else router.refresh();
  }

  const badge = BADGE[reviewStatus];
  const isLive = publishStatus === "PUBLISHED";

  return (
    <div className="mb-6 rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium">Review status</span>
        <Badge variant={badge.variant}>{badge.label}</Badge>
        <span className="text-xs text-muted-foreground">Your share of each sale: {revenueSharePercent}%</span>
      </div>

      {reviewNote && (reviewStatus === "CHANGES_REQUESTED" || reviewStatus === "DRAFT") ? (
        <Alert variant={reviewStatus === "CHANGES_REQUESTED" ? "destructive" : "default"} className="mt-3">
          <AlertTitle>Reviewer note</AlertTitle>
          <AlertDescription>{reviewNote}</AlertDescription>
        </Alert>
      ) : null}

      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {(reviewStatus === "DRAFT" || reviewStatus === "CHANGES_REQUESTED") ? (
          <Button size="sm" disabled={busy} onClick={() => run(() => submitProductForReview(productId))}>
            Submit for review
          </Button>
        ) : null}
        {reviewStatus === "APPROVED" && !isLive ? (
          <Button size="sm" disabled={busy} onClick={() => run(() => setMyProductPublished(productId, true))}>
            Publish
          </Button>
        ) : null}
        {reviewStatus === "APPROVED" && isLive ? (
          <Button size="sm" variant="outline" disabled={busy} onClick={() => run(() => setMyProductPublished(productId, false))}>
            Unpublish
          </Button>
        ) : null}
        {(reviewStatus === "APPROVED" || reviewStatus === "CHANGES_REQUESTED") ? (
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => run(() => reopenMyProduct(productId))}>
            Move back to draft
          </Button>
        ) : null}
      </div>

      {isLive ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
          <span className="truncate rounded bg-muted px-2 py-1 font-mono text-xs">{shareUrl}</span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(shareUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              } catch { /* ignore */ }
            }}
          >
            {copied ? "Copied" : "Copy link"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
