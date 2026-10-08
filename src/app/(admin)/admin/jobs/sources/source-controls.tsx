"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Play, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SOURCE_TYPES } from "@/lib/jobs/ingest/source-types";
import {
  addJobSource,
  deleteJobSource,
  runAllJobSourcesNow,
  runJobSourceNow,
  setJobSourceEnabled,
} from "./actions";

export function AddSourceForm() {
  const router = useRouter();
  const [type, setType] = useState(SOURCE_TYPES[0].type);
  const [name, setName] = useState("");
  const [config, setConfig] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const def = SOURCE_TYPES.find((t) => t.type === type)!;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await addJobSource({ type, name, config });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setName("");
    setConfig({});
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Source type</Label>
          <select
            value={type}
            onChange={(e) => { setType(e.target.value as typeof type); setConfig({}); }}
            className="h-10 w-full rounded-md border border-input bg-card px-2 text-sm"
          >
            {SOURCE_TYPES.map((t) => <option key={t.type} value={t.type}>{t.label}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Name shown as “via …”</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} placeholder="e.g. Stripe careers" />
        </div>
        {def.fields.map((f) => (
          <div key={f.key} className="space-y-1.5">
            <Label>{f.label}</Label>
            <Input
              value={config[f.key] ?? ""}
              onChange={(e) => setConfig((c) => ({ ...c, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              required={f.required}
            />
          </div>
        ))}
      </div>
      <Button type="submit" disabled={busy}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : null} Add source
      </Button>
    </form>
  );
}

export function RunAllButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setMsg(null);
    const res = await runAllJobSourcesNow();
    setBusy(false);
    if (!res.ok) return setMsg(res.error);
    const created = res.data.reduce((n, r) => n + r.created, 0);
    const failed = res.data.filter((r) => r.error).length;
    setMsg(`Checked ${res.data.length} source${res.data.length === 1 ? "" : "s"} — ${created} new draft${created === 1 ? "" : "s"}${failed ? `, ${failed} failed` : ""}.`);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      <Button onClick={run} disabled={busy}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />} Run all now
      </Button>
      {msg ? <span className="text-sm text-muted-foreground">{msg}</span> : null}
    </div>
  );
}

export function SourceActions({ id, enabled }: { id: string; enabled: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"run" | "toggle" | "delete" | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function run() {
    setBusy("run");
    setMsg(null);
    const res = await runJobSourceNow(id);
    setBusy(null);
    setMsg(res.ok ? (res.data.error ? res.data.error : `${res.data.created} new, ${res.data.closed} closed`) : res.error);
    router.refresh();
  }
  async function toggle() {
    setBusy("toggle");
    await setJobSourceEnabled(id, !enabled);
    setBusy(null);
    router.refresh();
  }
  async function remove() {
    if (!confirm("Delete this source? Jobs it already imported stay on the site.")) return;
    setBusy("delete");
    await deleteJobSource(id);
    setBusy(null);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1.5">
        <Button size="sm" variant="outline" onClick={run} disabled={busy !== null}>
          {busy === "run" ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />} Run
        </Button>
        <Button size="sm" variant="ghost" onClick={toggle} disabled={busy !== null}>
          {enabled ? "Pause" : "Enable"}
        </Button>
        <Button size="sm" variant="ghost" onClick={remove} disabled={busy !== null} aria-label="Delete source">
          <Trash2 className="size-3.5" />
        </Button>
      </div>
      {msg ? <p className="max-w-xs text-right text-xs text-muted-foreground">{msg}</p> : null}
    </div>
  );
}
