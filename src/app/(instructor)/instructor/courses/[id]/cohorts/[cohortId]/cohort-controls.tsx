"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { setCohortStatus, addSession, deleteSession, issueCohortCertificatesAction } from "../actions";
import type { CohortStatus } from "@prisma/client";

const TRANSITIONS: Record<string, { to: CohortStatus; label: string; variant?: "outline" | "ghost" }[]> = {
  DRAFT: [{ to: "OPEN", label: "Open for enrolment" }, { to: "CANCELLED", label: "Cancel", variant: "ghost" }],
  OPEN: [{ to: "RUNNING", label: "Mark as running" }, { to: "DRAFT", label: "Back to draft", variant: "outline" }, { to: "CANCELLED", label: "Cancel", variant: "ghost" }],
  RUNNING: [{ to: "COMPLETED", label: "Mark completed" }, { to: "CANCELLED", label: "Cancel", variant: "ghost" }],
  COMPLETED: [],
  CANCELLED: [{ to: "DRAFT", label: "Reopen as draft", variant: "outline" }],
};

export function StatusControls({ cohortId, status }: { cohortId: string; status: CohortStatus }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const options = TRANSITIONS[status] ?? [];
  if (options.length === 0) return <p className="text-sm text-muted-foreground">This class is {status.toLowerCase()}.</p>;

  async function go(to: CohortStatus) {
    setBusy(true);
    setError(null);
    const res = await setCohortStatus(cohortId, to);
    setBusy(false);
    if (res.ok) router.refresh();
    else setError(res.error);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <Button key={o.to} size="sm" variant={o.variant} disabled={busy} onClick={() => go(o.to)}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : null} {o.label}
          </Button>
        ))}
      </div>
      {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
    </div>
  );
}

export function IssueCertificatesButton({ cohortId }: { cohortId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function run() {
    setBusy(true);
    setMsg(null);
    const res = await issueCohortCertificatesAction(cohortId);
    setBusy(false);
    if (!res.ok) {
      setMsg({ ok: false, text: res.error });
      return;
    }
    const { issued, skipped } = res.data;
    setMsg({
      ok: true,
      text:
        `Issued ${issued} new certificate${issued === 1 ? "" : "s"}.` +
        (skipped.length ? ` Skipped ${skipped.length} for low attendance: ${skipped.map((s) => s.name).join(", ")}.` : ""),
    });
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <Button size="sm" variant="outline" disabled={busy} onClick={run}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : null} Issue / re-run certificates
      </Button>
      {msg ? (
        <Alert variant={msg.ok ? "success" : "destructive"}>
          <AlertDescription>{msg.text}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}

export function SessionManager({
  cohortId,
  sessions,
}: {
  cohortId: string;
  sessions: { id: string; title: string; startsAt: string; durationMinutes: number; meetingUrl: string | null; note: string | null }[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState({ title: "", startsAt: "", durationMinutes: "60", meetingUrl: "", note: "" });
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await addSession(cohortId, { ...f, meetingUrl: f.meetingUrl || "", note: f.note || "" });
    setBusy(false);
    if (res.ok) {
      setF({ title: "", startsAt: "", durationMinutes: "60", meetingUrl: "", note: "" });
      router.refresh();
    } else setError(res.error);
  }

  async function remove(id: string) {
    if (!confirm("Delete this session?")) return;
    const res = await deleteSession(id);
    if (res.ok) router.refresh();
    else setError(res.error);
  }

  return (
    <div className="space-y-4">
      {sessions.length > 0 ? (
        <ul className="divide-y text-sm">
          {sessions.map((s) => (
            <li key={s.id} className="flex items-start justify-between gap-3 py-2">
              <div>
                <p className="font-medium">{s.title}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(s.startsAt).toLocaleString()} · {s.durationMinutes} min
                  {s.meetingUrl ? " · has link" : ""}
                </p>
                {s.note ? <p className="text-xs text-muted-foreground">{s.note}</p> : null}
              </div>
              <button type="button" onClick={() => remove(s.id)} className="text-muted-foreground hover:text-destructive" aria-label="Delete session">
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No sessions scheduled.</p>
      )}

      <form onSubmit={add} className="space-y-3 border-t pt-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="s-title">Session title</Label>
            <Input id="s-title" value={f.title} onChange={(e) => set("title", e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="s-when">When</Label>
            <Input id="s-when" type="datetime-local" value={f.startsAt} onChange={(e) => set("startsAt", e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="s-dur">Duration (min)</Label>
            <Input id="s-dur" type="number" min={5} max={600} value={f.durationMinutes} onChange={(e) => set("durationMinutes", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="s-url">Meeting link (optional)</Label>
            <Input id="s-url" type="url" value={f.meetingUrl} onChange={(e) => set("meetingUrl", e.target.value)} />
          </div>
        </div>
        {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
        <Button type="submit" size="sm" disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : null} Add session
        </Button>
      </form>
    </div>
  );
}
