"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { decideCourseReview, setCourseRevenueShare } from "./actions";

export function CourseReviewRow({
  id,
  title,
  instructor,
  priceLabel,
  discountPercent,
  discountEndsAt,
  revenueSharePercent,
  moduleCount,
  lessonCount,
  submittedAt,
  previewHref,
}: {
  id: string;
  title: string;
  instructor: string;
  priceLabel: string;
  discountPercent: number | null;
  discountEndsAt: string | null;
  revenueSharePercent: number;
  moduleCount: number;
  lessonCount: number;
  submittedAt: string;
  previewHref: string;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [share, setShare] = useState(revenueSharePercent);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function decide(decision: "APPROVED" | "CHANGES_REQUESTED" | "REJECTED") {
    setBusy(decision);
    setError(null);
    if (share !== revenueSharePercent) await setCourseRevenueShare(id, share);
    const res = await decideCourseReview(id, decision, note);
    setBusy(null);
    if (!res.ok) setError(res.error);
    else router.refresh();
  }

  return (
    <div className="rounded-lg border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Link href={previewHref} className="font-medium hover:underline">{title}</Link>
          <p className="text-xs text-muted-foreground">
            by {instructor} · submitted {submittedAt} · {moduleCount} modules / {lessonCount} lessons
          </p>
        </div>
      </div>

      <div className="mt-2 grid gap-2 text-sm sm:grid-cols-3">
        <p><span className="text-muted-foreground">Price:</span> {priceLabel}</p>
        <p>
          <span className="text-muted-foreground">Discount:</span>{" "}
          {discountPercent && discountPercent > 0
            ? `${discountPercent}%${discountEndsAt ? ` until ${discountEndsAt}` : ""}`
            : "none"}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Instructor share:</span>
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
        placeholder="Note to the instructor (required to reject or request changes)"
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
        <Button asChild size="sm" variant="ghost">
          <Link href={previewHref} target="_blank">Open full course</Link>
        </Button>
      </div>
    </div>
  );
}
