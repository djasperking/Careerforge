"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AI_FEATURE_KEYS, AI_FEATURE_LABELS } from "@/lib/ai/prompts";
import { createPromptVersion, setPromptActive } from "./actions";

interface PromptRow {
  id: string;
  key: string;
  version: number;
  systemPrompt: string;
  isActive: boolean;
  aiGenerated?: boolean;
}

export function PromptManager({ prompts }: { prompts: PromptRow[] }) {
  const router = useRouter();
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const byKey = new Map<string, PromptRow[]>();
  for (const p of prompts) byKey.set(p.key, [...(byKey.get(p.key) ?? []), p]);

  return (
    <div className="space-y-4">
      {AI_FEATURE_KEYS.map((key) => {
        const versions = (byKey.get(key) ?? []).sort((a, b) => b.version - a.version);
        const active = versions.find((v) => v.isActive);
        return (
          <div key={key} className="rounded-md border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{AI_FEATURE_LABELS[key]}</p>
                <p className="text-xs text-muted-foreground">
                  {active ? `Custom prompt active (v${active.version})` : "Using the built-in default prompt"}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setOpenKey(openKey === key ? null : key)}>
                <Plus className="size-3.5" /> New version
              </Button>
            </div>

            {versions.length > 0 ? (
              <ul className="mt-2 space-y-1">
                {versions.map((v) => (
                  <li key={v.id} className="flex items-center justify-between rounded bg-muted/40 px-2 py-1 text-xs">
                    <span className="truncate">v{v.version} — {v.systemPrompt.slice(0, 60)}{v.systemPrompt.length > 60 ? "…" : ""}</span>
                    <div className="flex shrink-0 items-center gap-2">
                      {v.isActive ? <Badge variant="success">Active</Badge> : (
                        <Button
                          size="sm" variant="ghost" className="h-6 px-2 text-xs" disabled={pending}
                          onClick={() => start(async () => { await setPromptActive(v.id, key, true); router.refresh(); })}
                        >
                          Activate
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}

            {openKey === key ? (
              <NewVersionForm featureKey={key} onDone={() => { setOpenKey(null); router.refresh(); }} />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function NewVersionForm({ featureKey, onDone }: { featureKey: string; onDone: () => void }) {
  const [systemPrompt, setSystemPrompt] = useState("");
  const [notes, setNotes] = useState("");
  const [activate, setActivate] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const res = await createPromptVersion({ key: featureKey, systemPrompt, userTemplate: "{{input}}", notes, activate });
    setSaving(false);
    if (!res.ok) setError(res.error);
    else onDone();
  }

  return (
    <div className="mt-3 space-y-2 rounded-md border bg-muted/30 p-3">
      {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
      <div className="space-y-1">
        <Label className="text-xs">System prompt / instructions</Label>
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          rows={4}
          placeholder="Extra instructions layered on top of Career Forge's safety rules (which always apply)."
          className="flex w-full rounded-md border border-input bg-card px-2 py-1.5 text-sm"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Notes (optional)</Label>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} className="h-8" />
      </div>
      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" checked={activate} onChange={(e) => setActivate(e.target.checked)} className="size-3.5" />
        Activate immediately
      </label>
      <Button size="sm" onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="size-4 animate-spin" /> : "Save version"}
      </Button>
    </div>
  );
}
