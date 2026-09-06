"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createMyCourse } from "../../actions";

export function NewCourseForm({ categories }: { categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    description: "",
    thumbnailUrl: "",
    categoryId: "",
    level: "BEGINNER" as "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
    durationMinutes: 0,
    priceCents: 0,
    currency: "NGN",
    requirements: "",
    objectives: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await createMyCourse(form);
    setSaving(false);
    if (!res.ok) setError(res.error);
    else router.push(`/instructor/courses/${res.data.id}`);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error ? (
        <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
      ) : null}

      <div className="space-y-1.5">
        <Label>Title</Label>
        <Input value={form.title} onChange={(e) => set("title", e.target.value)} required minLength={3} />
      </div>
      <div className="space-y-1.5">
        <Label>Description</Label>
        <textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={4}
          required
          minLength={10}
          className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Level</Label>
          <select value={form.level} onChange={(e) => set("level", e.target.value as typeof form.level)} className="h-10 w-full rounded-md border border-input bg-card px-2 text-sm">
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
          <Label>Price (kobo — 100000 = ₦1,000)</Label>
          <Input type="number" min={0} value={form.priceCents} onChange={(e) => set("priceCents", Number(e.target.value))} />
        </div>
        <div className="space-y-1.5">
          <Label>Currency</Label>
          <Input value={form.currency} maxLength={3} onChange={(e) => set("currency", e.target.value.toUpperCase())} />
        </div>
      </div>
      <Button type="submit" disabled={saving}>{saving ? "Creating…" : "Create course"}</Button>
    </form>
  );
}
