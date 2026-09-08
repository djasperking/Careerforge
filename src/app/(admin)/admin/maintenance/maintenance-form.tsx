"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { saveMaintenanceAction } from "./actions";

type Row = { key: string; label: string; off: boolean; note: string };

export function MaintenanceForm({ sections }: { sections: Row[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(sections);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function update(key: string, patch: Partial<Row>) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  async function save() {
    setBusy(true);
    setMsg(null);
    const payload = Object.fromEntries(rows.map((r) => [r.key, { off: r.off, note: r.note }]));
    const res = await saveMaintenanceAction(payload);
    setBusy(false);
    if (res.ok) {
      setMsg({ ok: true, text: "Saved. Changes are live now." });
      router.refresh();
    } else {
      setMsg({ ok: false, text: res.error });
    }
  }

  return (
    <div className="space-y-4">
      {rows.map((r) => (
        <div
          key={r.key}
          className={`rounded-lg border p-4 ${r.off ? "border-warning/50 bg-warning/5" : ""}`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <p className="font-medium">{r.label}</p>
              {r.key === "site" ? (
                <span className="text-xs text-muted-foreground">overrides everything below</span>
              ) : null}
              {r.off ? <Badge variant="warning">In maintenance</Badge> : <Badge variant="success">Live</Badge>}
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={r.off}
                onChange={(e) => update(r.key, { off: e.target.checked })}
                className="size-4"
              />
              Pause this section
            </label>
          </div>
          <textarea
            value={r.note}
            onChange={(e) => update(r.key, { note: e.target.value })}
            rows={2}
            maxLength={600}
            placeholder="Message shown to visitors (optional — a friendly default is used if blank)"
            className="mt-3 flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
          />
        </div>
      ))}

      {msg ? (
        <Alert variant={msg.ok ? "success" : "destructive"}>
          <AlertDescription>{msg.text}</AlertDescription>
        </Alert>
      ) : null}

      <Button onClick={save} disabled={busy}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : null} Save changes
      </Button>
    </div>
  );
}
