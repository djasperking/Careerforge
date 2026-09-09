"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { minorToMajor, majorToMinor } from "@/lib/utils";
import { updatePlan } from "./actions";

function num(v: unknown, fallback: number) {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

export function PlanEditor({
  planId, planKey, initial,
}: {
  planId: string;
  planKey: string;
  initial: {
    name: string;
    priceCents: number;
    billingPeriod: string;
    features: string;
    isActive: boolean;
    limits: Record<string, unknown>;
  };
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: initial.name,
    priceCents: initial.priceCents,
    billingPeriod: initial.billingPeriod,
    features: initial.features,
    isActive: initial.isActive,
    // -1 means unlimited; we surface it as an empty field + "Unlimited" toggle.
    cvCount: num(initial.limits["cv:count"], planKey === "FREE" ? 1 : -1),
    aiPerMonth: num(initial.limits["ai:requestsPerMonth"], 15),
    premiumTemplates: initial.limits["cv:premiumTemplates"] === true,
  });

  if (!editing) {
    return (
      <div className="mt-3 space-y-1">
        <p className="text-xs text-muted-foreground">
          {form.cvCount === -1 ? "Unlimited" : form.cvCount} CV{form.cvCount === 1 ? "" : "s"} ·{" "}
          {form.aiPerMonth} AI/mo · {form.premiumTemplates ? "premium templates" : "standard templates"}
        </p>
        <Button size="sm" variant="outline" className="w-full" onClick={() => setEditing(true)}>
          <Pencil className="size-3.5" /> Edit
        </Button>
      </div>
    );
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const res = await updatePlan(planId, {
      name: form.name,
      priceCents: form.priceCents,
      billingPeriod: form.billingPeriod,
      features: form.features,
      isActive: form.isActive,
      limits: {
        "cv:count": form.cvCount,
        "ai:requestsPerMonth": Math.max(0, form.aiPerMonth),
        "cv:premiumTemplates": form.premiumTemplates,
      },
    });
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
          <Label className="text-xs">Price (₦)</Label>
          <Input type="number" min={0} step="0.01" value={minorToMajor(form.priceCents)} onChange={(e) => setForm((f) => ({ ...f, priceCents: majorToMinor(e.target.value as unknown as number) }))} className="h-8" />
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

      <div className="rounded-md border bg-card p-2">
        <p className="mb-1.5 text-xs font-medium">Usage limits</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">CVs allowed</Label>
            <Input
              type="number"
              min={0}
              value={form.cvCount === -1 ? "" : form.cvCount}
              placeholder="Unlimited"
              disabled={form.cvCount === -1}
              onChange={(e) => setForm((f) => ({ ...f, cvCount: Math.max(0, Number(e.target.value) || 0) }))}
              className="h-8"
            />
          </div>
          <label className="flex items-end gap-2 pb-1.5 text-xs">
            <input
              type="checkbox"
              checked={form.cvCount === -1}
              onChange={(e) => setForm((f) => ({ ...f, cvCount: e.target.checked ? -1 : 5 }))}
              className="size-3.5"
            />
            Unlimited CVs
          </label>
          <div className="space-y-1">
            <Label className="text-xs">AI requests / month</Label>
            <Input
              type="number"
              min={0}
              value={form.aiPerMonth}
              onChange={(e) => setForm((f) => ({ ...f, aiPerMonth: Math.max(0, Number(e.target.value) || 0) }))}
              className="h-8"
            />
          </div>
          <label className="flex items-end gap-2 pb-1.5 text-xs">
            <input
              type="checkbox"
              checked={form.premiumTemplates}
              onChange={(e) => setForm((f) => ({ ...f, premiumTemplates: e.target.checked }))}
              className="size-3.5"
            />
            Premium templates
          </label>
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
