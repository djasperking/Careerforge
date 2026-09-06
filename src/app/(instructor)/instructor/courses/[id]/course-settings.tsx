"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { updateMyCourse } from "../../actions";

interface Initial {
  title: string;
  description: string;
  thumbnailUrl: string;
  categoryId: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  durationMinutes: number;
  priceCents: number;
  currency: string;
  requirements: string;
  objectives: string;
  discountPercent: number;
  discountEndsAt: string;
}

export function InstructorCourseSettings({
  courseId,
  categories,
  initial,
  locked,
}: {
  courseId: string;
  categories: { id: string; name: string }[];
  initial: Initial;
  locked: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  function set<K extends keyof Initial>(k: K, v: Initial[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    const res = await updateMyCourse(courseId, form);
    setSaving(false);
    setMsg(res.ok ? { type: "ok", text: "Saved." } : { type: "error", text: res.error });
    if (res.ok) router.refresh();
  }

  const discounted =
    form.discountPercent > 0
      ? Math.round(form.priceCents * (1 - form.discountPercent / 100))
      : form.priceCents;

  return (
    <div className="space-y-4">
      {msg ? (
        <Alert variant={msg.type === "ok" ? "success" : "destructive"}>
          <AlertDescription>{msg.text}</AlertDescription>
        </Alert>
      ) : null}

      <fieldset disabled={locked} className="space-y-4 disabled:opacity-60">
        <div className="space-y-1.5">
          <Label>Title</Label>
          <Input value={form.title} onChange={(e) => set("title", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Description</Label>
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={4}
            className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Level</Label>
            <select value={form.level} onChange={(e) => set("level", e.target.value as Initial["level"])} className="h-10 w-full rounded-md border border-input bg-card px-2 text-sm">
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <select value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)} className="h-10 w-full rounded-md border border-input bg-card px-2 text-sm">
              <option value="">None</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Duration (minutes)</Label>
            <Input type="number" min={0} value={form.durationMinutes} onChange={(e) => set("durationMinutes", Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label>Thumbnail URL</Label>
            <Input value={form.thumbnailUrl} onChange={(e) => set("thumbnailUrl", e.target.value)} placeholder="https://…" />
          </div>
          <div className="space-y-1.5">
            <Label>Price (kobo — 100000 = ₦1,000)</Label>
            <Input type="number" min={0} value={form.priceCents} onChange={(e) => set("priceCents", Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label>Currency</Label>
            <Input value={form.currency} maxLength={3} onChange={(e) => set("currency", e.target.value.toUpperCase())} />
          </div>
        </div>

        <div className="rounded-md border p-3">
          <p className="text-sm font-medium">Discount (optional)</p>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Percent off (0–90)</Label>
              <Input
                type="number"
                min={0}
                max={90}
                value={form.discountPercent}
                onChange={(e) => set("discountPercent", Math.max(0, Math.min(90, Number(e.target.value))))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Ends on (optional)</Label>
              <Input type="date" value={form.discountEndsAt} onChange={(e) => set("discountEndsAt", e.target.value)} />
            </div>
          </div>
          {form.discountPercent > 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Buyers pay <span className="font-medium text-foreground">{discounted}</span> instead of {form.priceCents}.
              The discount is subject to admin review.
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label>Requirements (one per line)</Label>
          <textarea value={form.requirements} onChange={(e) => set("requirements", e.target.value)} rows={3} className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label>Learning objectives (one per line)</Label>
          <textarea value={form.objectives} onChange={(e) => set("objectives", e.target.value)} rows={3} className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm" />
        </div>
      </fieldset>

      <Button onClick={save} disabled={saving || locked}>
        {saving ? <Loader2 className="size-4 animate-spin" /> : null}
        Save settings
      </Button>
    </div>
  );
}
