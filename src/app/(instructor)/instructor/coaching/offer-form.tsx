"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ImageField } from "@/components/ui/image-field";
import { minorToMajor, majorToMinor } from "@/lib/utils";
import { createMyOffer, updateMyOffer } from "./actions";

export interface OfferFormValues {
  title: string;
  description: string;
  coverImageUrl: string;
  durationMinutes: number;
  priceCents: number;
  currency: string;
}

const EMPTY: OfferFormValues = {
  title: "",
  description: "",
  coverImageUrl: "",
  durationMinutes: 45,
  priceCents: 0,
  currency: "NGN",
};

export function OfferForm({
  offerId,
  initial,
  locked = false,
}: {
  offerId?: string;
  initial?: OfferFormValues;
  locked?: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState<OfferFormValues>(initial ?? EMPTY);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  function set<K extends keyof OfferFormValues>(k: K, v: OfferFormValues[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const res = offerId ? await updateMyOffer(offerId, form) : await createMyOffer(form);
    setSaving(false);
    if (!res.ok) {
      setMsg({ type: "error", text: res.error });
      return;
    }
    if (offerId) {
      setMsg({ type: "ok", text: "Saved." });
      router.refresh();
    } else {
      router.push(`/instructor/coaching/${(res.data as { id: string }).id}`);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {msg ? (
        <Alert variant={msg.type === "ok" ? "success" : "destructive"}>
          <AlertDescription>{msg.text}</AlertDescription>
        </Alert>
      ) : null}

      <fieldset disabled={locked} className="space-y-4 disabled:opacity-60">
        <div className="space-y-1.5">
          <Label>Title</Label>
          <Input value={form.title} onChange={(e) => set("title", e.target.value)} required minLength={3} placeholder="e.g. 45-min CV review & career strategy call" />
        </div>
        <div className="space-y-1.5">
          <Label>Description</Label>
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={4}
            required
            minLength={20}
            className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
            placeholder="What the session covers, who it's for, how to prepare."
          />
        </div>
        <div className="space-y-1.5">
          <Label>Cover image (optional)</Label>
          <ImageField value={form.coverImageUrl} onChange={(v) => set("coverImageUrl", v)} kind="course-thumbnail" disabled={locked} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Duration (minutes)</Label>
            <Input type="number" min={15} max={240} value={form.durationMinutes} onChange={(e) => set("durationMinutes", Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label>Price (₦)</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={minorToMajor(form.priceCents)}
              onChange={(e) => set("priceCents", majorToMinor(e.target.value as unknown as number))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Currency</Label>
            <Input value={form.currency} maxLength={3} onChange={(e) => set("currency", e.target.value.toUpperCase())} />
          </div>
        </div>
      </fieldset>

      <Button type="submit" disabled={saving || locked}>
        {saving ? <Loader2 className="size-4 animate-spin" /> : null}
        {offerId ? "Save offer" : "Create offer"}
      </Button>
    </form>
  );
}
