"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { updateExamSettings } from "../actions";

interface Props {
  examId: string;
  courses: { id: string; title: string }[];
  initial: {
    title: string;
    description: string;
    courseId: string;
    timeLimitMinutes: number;
    questionCount: number;
    passingScore: number;
    maxAttempts: number;
    randomizeQuestions: boolean;
    randomizeOptions: boolean;
    gradingMode: "AUTO" | "MANUAL" | "HYBRID";
    revealAnswers: boolean;
  };
}

export function ExamSettingsForm({ examId, courses, initial }: Props) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setMsg(null);
    const res = await updateExamSettings(examId, form);
    setSaving(false);
    setMsg(res.ok ? { type: "ok", text: "Saved." } : { type: "error", text: res.error });
    if (res.ok) router.refresh();
  }

  return (
    <div className="space-y-4">
      {msg ? <Alert variant={msg.type === "ok" ? "success" : "destructive"}><AlertDescription>{msg.text}</AlertDescription></Alert> : null}

      <div className="space-y-1.5">
        <Label>Title</Label>
        <Input value={form.title} onChange={(e) => set("title", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Description</Label>
        <textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={2}
          className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Course</Label>
        <select value={form.courseId} onChange={(e) => set("courseId", e.target.value)} className="h-10 w-full rounded-md border border-input bg-card px-2 text-sm">
          <option value="">Standalone (no course)</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="space-y-1.5">
          <Label>Time limit (min)</Label>
          <Input type="number" min={1} value={form.timeLimitMinutes} onChange={(e) => set("timeLimitMinutes", Number(e.target.value))} />
        </div>
        <div className="space-y-1.5">
          <Label>Questions per attempt</Label>
          <Input type="number" min={1} value={form.questionCount} onChange={(e) => set("questionCount", Number(e.target.value))} />
        </div>
        <div className="space-y-1.5">
          <Label>Pass %</Label>
          <Input type="number" min={0} max={100} value={form.passingScore} onChange={(e) => set("passingScore", Number(e.target.value))} />
        </div>
        <div className="space-y-1.5">
          <Label>Max attempts</Label>
          <Input type="number" min={1} value={form.maxAttempts} onChange={(e) => set("maxAttempts", Number(e.target.value))} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Grading mode</Label>
        <select value={form.gradingMode} onChange={(e) => set("gradingMode", e.target.value as typeof form.gradingMode)} className="h-10 w-full rounded-md border border-input bg-card px-2 text-sm">
          <option value="AUTO">Auto (objective + AI-assisted essay/short-answer)</option>
          <option value="MANUAL">Manual (admin grades everything subjective)</option>
          <option value="HYBRID">Hybrid</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="size-4" checked={form.randomizeQuestions} onChange={(e) => set("randomizeQuestions", e.target.checked)} />
          Randomize question order
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="size-4" checked={form.randomizeOptions} onChange={(e) => set("randomizeOptions", e.target.checked)} />
          Randomize answer options
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="size-4" checked={form.revealAnswers} onChange={(e) => set("revealAnswers", e.target.checked)} />
          Reveal correct answers immediately after submission
        </label>
      </div>

      <Button onClick={handleSave} disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : null}Save settings</Button>
    </div>
  );
}
