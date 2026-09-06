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
import { updateCourse, createCategory } from "../actions";

interface Props {
  courseId: string;
  categories: { id: string; name: string }[];
  initial: {
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
  };
}

export function CourseSettingsForm({ courseId, categories: initialCategories, initial }: Props) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [categories, setCategories] = useState(initialCategories);
  const [newCategory, setNewCategory] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setMsg(null);
    const res = await updateCourse(courseId, form);
    setSaving(false);
    setMsg(res.ok ? { type: "ok", text: "Saved." } : { type: "error", text: res.error });
    if (res.ok) router.refresh();
  }

  async function handleAddCategory() {
    if (!newCategory.trim()) return;
    const res = await createCategory(newCategory);
    if (res.ok) {
      setCategories((c) => [...c, res.data]);
      set("categoryId", res.data.id);
      setNewCategory("");
    }
  }

  return (
    <div className="space-y-4">
      {msg ? (
        <Alert variant={msg.type === "ok" ? "success" : "destructive"}>
          <AlertDescription>{msg.text}</AlertDescription>
        </Alert>
      ) : null}

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
          className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Thumbnail</Label>
          <ImageField value={form.thumbnailUrl} onChange={(v) => set("thumbnailUrl", v)} />
        </div>
        <div className="space-y-1.5">
          <Label>Level</Label>
          <select
            value={form.level}
            onChange={(e) => set("level", e.target.value as typeof form.level)}
            className="h-10 w-full rounded-md border border-input bg-card px-2 text-sm"
          >
            <option value="BEGINNER">Beginner</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Category</Label>
          <select
            value={form.categoryId}
            onChange={(e) => set("categoryId", e.target.value)}
            className="h-10 w-full rounded-md border border-input bg-card px-2 text-sm"
          >
            <option value="">None</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <div className="flex gap-1.5 pt-1">
            <Input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="New category…" className="h-8 text-xs" />
            <Button type="button" size="sm" variant="outline" className="h-8" onClick={handleAddCategory}>Add</Button>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Duration (minutes)</Label>
          <Input type="number" min={0} value={form.durationMinutes} onChange={(e) => set("durationMinutes", Number(e.target.value))} />
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
          <p className="text-xs text-muted-foreground">Amount in Naira. 0 = free course.</p>
        </div>
        <div className="space-y-1.5">
          <Label>Currency</Label>
          <Input value={form.currency} maxLength={3} onChange={(e) => set("currency", e.target.value.toUpperCase())} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Requirements (one per line)</Label>
        <textarea
          value={form.requirements}
          onChange={(e) => set("requirements", e.target.value)}
          rows={3}
          className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Learning objectives (one per line)</Label>
        <textarea
          value={form.objectives}
          onChange={(e) => set("objectives", e.target.value)}
          rows={3}
          className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="size-4 animate-spin" /> : null}
        Save settings
      </Button>
    </div>
  );
}
