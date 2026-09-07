"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveAttendance, notifyCohortWaitlist } from "../actions";

type Member = { userId: string; name: string };

export function AttendanceSheet({
  sessionId,
  title,
  when,
  roster,
  present,
}: {
  sessionId: string;
  title: string;
  when: string;
  roster: Member[];
  present: string[];
}) {
  const router = useRouter();
  const [marks, setMarks] = useState<Record<string, boolean>>(
    Object.fromEntries(roster.map((m) => [m.userId, present.includes(m.userId)])),
  );
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setBusy(true);
    setSaved(false);
    await saveAttendance(
      sessionId,
      roster.map((m) => ({ userId: m.userId, present: !!marks[m.userId] })),
    );
    setBusy(false);
    setSaved(true);
    router.refresh();
  }

  const count = Object.values(marks).filter(Boolean).length;

  return (
    <details className="rounded-lg border">
      <summary className="cursor-pointer px-3 py-2 text-sm font-medium">
        {title} <span className="text-muted-foreground">· {when} · {count}/{roster.length} present</span>
      </summary>
      <div className="border-t p-3">
        {roster.length === 0 ? (
          <p className="text-sm text-muted-foreground">No one on the roster yet.</p>
        ) : (
          <ul className="space-y-1">
            {roster.map((m) => (
              <li key={m.userId}>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="size-4"
                    checked={!!marks[m.userId]}
                    onChange={(e) => setMarks((s) => ({ ...s, [m.userId]: e.target.checked }))}
                  />
                  {m.name}
                </label>
              </li>
            ))}
          </ul>
        )}
        <Button size="sm" className="mt-3" onClick={save} disabled={busy || roster.length === 0}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : saved ? <Check className="size-4" /> : null}
          Save attendance
        </Button>
      </div>
    </details>
  );
}

export function NotifyWaitlistButton({ cohortId, count }: { cohortId: string; count: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function go() {
    if (!confirm(`Email the ${count} people on the waitlist that a seat opened up?`)) return;
    setBusy(true);
    await notifyCohortWaitlist(cohortId);
    setBusy(false);
    setDone(true);
    router.refresh();
  }

  return (
    <Button size="sm" variant="outline" onClick={go} disabled={busy || count === 0}>
      {busy ? <Loader2 className="size-4 animate-spin" /> : null}
      {done ? "Waitlist notified" : `Notify waitlist (${count})`}
    </Button>
  );
}
