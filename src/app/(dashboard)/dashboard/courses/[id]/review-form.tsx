"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StarInput } from "@/components/ui/star-rating";
import { submitCourseReview, removeCourseReview } from "../actions";

const TA = "mt-3 flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm";

export function CourseReviewForm({
  courseId,
  initial,
}: {
  courseId: string;
  initial: { rating: number; body: string } | null;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [body, setBody] = useState(initial?.body ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save() {
    if (rating < 1) {
      setMsg({ ok: false, text: "Pick a star rating first." });
      return;
    }
    setBusy(true);
    setMsg(null);
    const res = await submitCourseReview({ courseId, rating, body: body || undefined });
    setBusy(false);
    setMsg(res.ok ? { ok: true, text: "Thanks — your review is live." } : { ok: false, text: res.error });
    if (res.ok) router.refresh();
  }

  async function remove() {
    setBusy(true);
    await removeCourseReview(courseId);
    setBusy(false);
    setRating(0);
    setBody("");
    setMsg({ ok: true, text: "Review removed." });
    router.refresh();
  }

  return (
    <div>
      <StarInput value={rating} onChange={setRating} />
      <textarea
        className={TA}
        rows={3}
        placeholder="What did you think? (optional)"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={2000}
      />
      {msg ? (
        <Alert variant={msg.ok ? "success" : "destructive"} className="mt-3">
          <AlertDescription>{msg.text}</AlertDescription>
        </Alert>
      ) : null}
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={save} disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : null} {initial ? "Update review" : "Post review"}
        </Button>
        {initial ? (
          <Button size="sm" variant="ghost" onClick={remove} disabled={busy} className="text-destructive hover:text-destructive">
            Delete
          </Button>
        ) : null}
      </div>
    </div>
  );
}
