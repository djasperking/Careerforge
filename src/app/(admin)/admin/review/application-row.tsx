"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { decideInstructorApplication } from "./actions";

export function InstructorApplicationRow({
  id,
  name,
  email,
  headline,
  bio,
  expertise,
  appliedAt,
}: {
  id: string;
  name: string | null;
  email: string;
  headline: string;
  bio: string;
  expertise: string[];
  appliedAt: string;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function decide(decision: "APPROVED" | "REJECTED") {
    setBusy(decision);
    setError(null);
    const res = await decideInstructorApplication(id, decision, note);
    setBusy(null);
    if (!res.ok) setError(res.error);
    else router.refresh();
  }

  return (
    <div className="rounded-lg border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium">{name || email}</p>
          <p className="text-xs text-muted-foreground">{email} · applied {appliedAt}</p>
        </div>
      </div>
      <p className="mt-2 text-sm font-medium">{headline}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{bio}</p>
      {expertise.length ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {expertise.map((e) => <Badge key={e} variant="outline">{e}</Badge>)}
        </div>
      ) : null}

      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder="Optional note to the applicant (required if rejecting)"
        className="mt-3 flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
      />
      <div className="mt-2 flex gap-2">
        <Button size="sm" disabled={busy !== null} onClick={() => decide("APPROVED")}>
          {busy === "APPROVED" ? "Approving…" : "Approve"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-destructive hover:text-destructive"
          disabled={busy !== null}
          onClick={() => decide("REJECTED")}
        >
          {busy === "REJECTED" ? "Rejecting…" : "Reject"}
        </Button>
      </div>
    </div>
  );
}
