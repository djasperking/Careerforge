"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Stars } from "@/components/ui/star-rating";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { moderateReview } from "../actions";

type Row = {
  id: string;
  rating: number;
  body: string | null;
  status: string;
  author: string;
  date: string;
};

export function ReviewModeration({ reviews }: { reviews: Row[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function run(id: string, action: "hide" | "show" | "delete") {
    if (action === "delete" && !confirm("Delete this review permanently?")) return;
    setBusy(id);
    await moderateReview(id, action);
    setBusy(null);
    router.refresh();
  }

  if (reviews.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">No reviews yet.</p>;
  }

  return (
    <ul className="divide-y">
      {reviews.map((r) => (
        <li key={r.id} className="py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Stars value={r.rating} size={14} />
              <span className="text-sm font-medium">{r.author}</span>
              <span className="text-xs text-muted-foreground">{r.date}</span>
              {r.status === "HIDDEN" ? <Badge variant="secondary">Hidden</Badge> : null}
            </div>
            <div className="flex gap-1">
              {r.status === "VISIBLE" ? (
                <Button size="sm" variant="ghost" disabled={busy === r.id} onClick={() => run(r.id, "hide")}>Hide</Button>
              ) : (
                <Button size="sm" variant="ghost" disabled={busy === r.id} onClick={() => run(r.id, "show")}>Show</Button>
              )}
              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" disabled={busy === r.id} onClick={() => run(r.id, "delete")}>
                Delete
              </Button>
            </div>
          </div>
          {r.body ? <p className="mt-1 text-sm text-muted-foreground">{r.body}</p> : null}
        </li>
      ))}
    </ul>
  );
}
