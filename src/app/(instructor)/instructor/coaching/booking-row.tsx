"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { confirmBooking, markBookingComplete } from "./actions";

export function BookingRow({
  bookingId,
  offerTitle,
  buyerName,
  status,
  preferredTimes,
  note,
  scheduledAt,
  meetingUrl,
}: {
  bookingId: string;
  offerTitle: string;
  buyerName: string;
  status: string;
  preferredTimes: string[];
  note: string | null;
  scheduledAt: string | null;
  meetingUrl: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [when, setWhen] = useState("");
  const [url, setUrl] = useState("");
  const [coachNote, setCoachNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setBusy(true);
    setError(null);
    const res = await confirmBooking(bookingId, { scheduledAt: when, meetingUrl: url, coachNote });
    setBusy(false);
    if (!res.ok) setError(res.error);
    else {
      setOpen(false);
      router.refresh();
    }
  }

  async function complete() {
    setBusy(true);
    await markBookingComplete(bookingId);
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="rounded-lg border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium">{offerTitle}</p>
          <p className="text-xs text-muted-foreground">Requested by {buyerName}</p>
        </div>
        <span className="text-xs font-medium text-muted-foreground">{status}</span>
      </div>

      {preferredTimes.length ? (
        <div className="mt-2 text-sm">
          <span className="text-muted-foreground">Times they suggested:</span>
          <ul className="ml-4 list-disc">{preferredTimes.map((t, i) => <li key={i}>{t}</li>)}</ul>
        </div>
      ) : null}
      {note ? <p className="mt-2 text-sm text-muted-foreground">“{note}”</p> : null}

      {scheduledAt ? (
        <p className="mt-2 text-sm">
          Scheduled for <span className="font-medium">{scheduledAt}</span>
          {meetingUrl ? <> · <a href={meetingUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">link</a></> : null}
        </p>
      ) : null}

      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {status === "REQUESTED" ? (
          open ? (
            <div className="w-full space-y-2 rounded-md border bg-muted/30 p-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Date &amp; time</Label>
                  <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="h-8" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Meeting link</Label>
                  <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://meet.google.com/…" className="h-8" />
                </div>
              </div>
              <Input value={coachNote} onChange={(e) => setCoachNote(e.target.value)} placeholder="Optional note to the buyer" className="h-8" />
              <div className="flex gap-2">
                <Button size="sm" onClick={confirm} disabled={busy}>Confirm session</Button>
                <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <Button size="sm" onClick={() => setOpen(true)}>Confirm a time</Button>
          )
        ) : null}
        {status === "CONFIRMED" ? (
          <Button size="sm" variant="outline" onClick={complete} disabled={busy}>Mark complete</Button>
        ) : null}
      </div>
    </div>
  );
}
