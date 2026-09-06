"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { requestCoachingBooking } from "./actions";

export function BookForm({
  offerId,
  slug,
  isLoggedIn,
  priceLabel,
}: {
  offerId: string;
  slug: string;
  isLoggedIn: boolean;
  priceLabel: string;
}) {
  const [times, setTimes] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isLoggedIn) {
    return (
      <Button asChild size="lg">
        <Link href={`/login?next=/coaching/${slug}`}>Log in to book</Link>
      </Button>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await requestCoachingBooking(offerId, { preferredTimes: times, note });
    setLoading(false);
    if (!res.ok) setError(res.error);
    else window.location.href = res.data.authorizationUrl;
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Times that work for you (one per line)</Label>
        <textarea
          value={times}
          onChange={(e) => setTimes(e.target.value)}
          rows={3}
          required
          placeholder={"Tue 3pm WAT\nWed morning\nThu after 5pm"}
          className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Anything the coach should know? (optional)</Label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
        />
      </div>
      {error ? (
        <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
      ) : null}
      <Button type="submit" size="lg" disabled={loading}>
        {loading ? <Loader2 className="size-4 animate-spin" /> : null}
        Pay {priceLabel} &amp; request
      </Button>
      <p className="text-xs text-muted-foreground">
        After payment the coach confirms one of your times and sends a meeting link.
      </p>
    </form>
  );
}
