"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePlan } from "./actions";

export function PlanEditor({
  planId, initial,
}: {
  planId: string;
  initial: { name: string; priceCents: number; billingPeriod: string; features: string; isActive: boolean };
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!editing) {
    return (
      <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => setEditing(true)}>
        <Pencil className="size-3.5" /> Edit
      </Button>
    );
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const res = await updatePlan(planId, form);
    setSaving(false);
    if (!res.ok) setError(res.error);
    else {
      setEditing(false);
      router.refresh();
    }
  }

  return (
    <div className="mt-3 space-y-2 rounded-md border bg-muted/30 p-3">
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <div className="space-y-1">
        <Label className="text-xs">Name</Label>
        <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="h-8" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Price (cents)</Label>
          <Input type="number" min={0} value={form.priceCents} onChange={(e) => setForm((f) => ({ ...f, priceCents: Number(e.target.value) }))} className="h-8" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Billing period</Label>
          <select value={form.billingPeriod} onChange={(e) => setForm((f) => ({ ...f, billingPeriod: e.target.value }))} className="h-8 w-full rounded-md border border-input bg-card px-2 text-sm">
            <option value="none">None</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Features (one per line)</Label>
        <textarea
          value={form.features}
          onChange={(e) => setForm((f) => ({ ...f, features: e.target.value }))}
          rows={3}
          className="flex w-full rounded-md border border-input bg-card px-2 py-1.5 text-sm"
        />
      </div>
      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="size-3.5" />
        Active (visible to customers)
      </label>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : "Save"}</Button>
        <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
      </div>
    </div>
  );
}
