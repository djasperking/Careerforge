"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PLACEMENTS } from "@/lib/ads/service";
import { createAd, setAdStatus, deleteAd } from "../actions";

interface AdRow {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  destinationUrl: string;
  placement: string;
  priority: number;
  maxImpressions: number | null;
  maxClicks: number | null;
  status: string;
  impressions: number;
  clicks: number;
}

const STATUS_VARIANT: Record<string, "success" | "secondary" | "warning"> = {
  ACTIVE: "success", DRAFT: "secondary", PAUSED: "warning", COMPLETED: "secondary", ARCHIVED: "secondary",
};

export function AdManager({ campaignId, ads }: { campaignId: string; ads: AdRow[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [pending, start] = useTransition();

  function refresh() {
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {ads.map((ad) => {
        const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : "0.0";
        return (
          <Card key={ad.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{ad.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {ad.placement} · priority {ad.priority} · {ad.impressions} impressions · {ad.clicks} clicks · {ctr}% CTR
                  </p>
                  <p className="text-xs text-muted-foreground">→ {ad.destinationUrl}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Badge variant={STATUS_VARIANT[ad.status]}>{ad.status}</Badge>
                  {ad.status === "ACTIVE" ? (
                    <Button size="sm" variant="outline" disabled={pending} onClick={() => start(async () => { await setAdStatus(ad.id, campaignId, "PAUSED"); refresh(); })}>Pause</Button>
                  ) : (
                    <Button size="sm" disabled={pending} onClick={() => start(async () => { await setAdStatus(ad.id, campaignId, "ACTIVE"); refresh(); })}>Activate</Button>
                  )}
                  <Button
                    size="icon" variant="ghost" className="text-destructive hover:text-destructive" disabled={pending}
                    onClick={() => { if (confirm("Delete this ad?")) start(async () => { await deleteAd(ad.id, campaignId); refresh(); }); }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {adding ? (
        <NewAdForm campaignId={campaignId} onDone={() => { setAdding(false); refresh(); }} onCancel={() => setAdding(false)} />
      ) : (
        <Button variant="outline" onClick={() => setAdding(true)}>
          <Plus className="size-4" /> Add advertisement
        </Button>
      )}
    </div>
  );
}

function NewAdForm({ campaignId, onDone, onCancel }: { campaignId: string; onDone: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    title: "", description: "", imageUrl: "", destinationUrl: "",
    placement: "DASHBOARD", priority: 0, maxImpressions: "", maxClicks: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const res = await createAd(campaignId, {
      ...form,
      priority: Number(form.priority),
      maxImpressions: form.maxImpressions ? Number(form.maxImpressions) : null,
      maxClicks: form.maxClicks ? Number(form.maxClicks) : null,
    });
    setSaving(false);
    if (!res.ok) setError(res.error);
    else onDone();
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1"><Label className="text-xs">Title</Label><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="h-9" /></div>
          <div className="space-y-1">
            <Label className="text-xs">Placement</Label>
            <select value={form.placement} onChange={(e) => setForm((f) => ({ ...f, placement: e.target.value }))} className="h-9 w-full rounded-md border border-input bg-card px-2 text-sm">
              {PLACEMENTS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <div className="space-y-1"><Label className="text-xs">Description</Label><Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="h-9" /></div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1"><Label className="text-xs">Image URL</Label><Input value={form.imageUrl} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))} className="h-9" placeholder="https://…" /></div>
          <div className="space-y-1"><Label className="text-xs">Destination URL</Label><Input value={form.destinationUrl} onChange={(e) => setForm((f) => ({ ...f, destinationUrl: e.target.value }))} className="h-9" placeholder="https://…" /></div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1"><Label className="text-xs">Priority</Label><Input type="number" value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: Number(e.target.value) }))} className="h-9" /></div>
          <div className="space-y-1"><Label className="text-xs">Max impressions</Label><Input type="number" value={form.maxImpressions} onChange={(e) => setForm((f) => ({ ...f, maxImpressions: e.target.value }))} className="h-9" placeholder="Unlimited" /></div>
          <div className="space-y-1"><Label className="text-xs">Max clicks</Label><Input type="number" value={form.maxClicks} onChange={(e) => setForm((f) => ({ ...f, maxClicks: e.target.value }))} className="h-9" placeholder="Unlimited" /></div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : "Save ad"}</Button>
          <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );
}
