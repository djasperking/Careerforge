"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createQuestion, updateQuestion, deleteQuestion, setQuestionReview } from "../actions";

type QType = "MULTIPLE_CHOICE" | "TRUE_FALSE" | "MULTIPLE_ANSWER" | "SHORT_ANSWER" | "ESSAY" | "SCENARIO";

interface OptionRow { id?: string; text: string; isCorrect: boolean }
interface QuestionRow {
  id: string;
  type: QType;
  prompt: string;
  explanation: string | null;
  points: number;
  difficulty: string | null;
  aiGenerated: boolean;
  reviewStatus: "DRAFT" | "APPROVED" | "REJECTED";
  options: OptionRow[];
}

const NEEDS_OPTIONS = new Set<QType>(["MULTIPLE_CHOICE", "TRUE_FALSE", "MULTIPLE_ANSWER"]);

function emptyForm(type: QType = "MULTIPLE_CHOICE") {
  return {
    type,
    prompt: "",
    explanation: "",
    points: 1,
    difficulty: "medium",
    topic: "",
    options: type === "TRUE_FALSE"
      ? [{ text: "True", isCorrect: true }, { text: "False", isCorrect: false }]
      : [{ text: "", isCorrect: true }, { text: "", isCorrect: false }],
  };
}

export function QuestionManager({ examId, questions }: { examId: string; questions: QuestionRow[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const drafts = questions.filter((q) => q.reviewStatus === "DRAFT");
  const approved = questions.filter((q) => q.reviewStatus === "APPROVED");

  function refresh() {
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {drafts.length > 0 ? (
        <div>
          <p className="mb-2 text-sm font-medium">Awaiting review ({drafts.length})</p>
          <div className="space-y-2">
            {drafts.map((q) => (
              <Card key={q.id} className="border-warning/40">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{q.prompt}</p>
                      {q.aiGenerated ? <Badge variant="warning" className="mt-1">AI-generated — review before use</Badge> : null}
                      <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                        {q.options.map((o, i) => (
                          <li key={i} className={o.isCorrect ? "font-medium text-success" : ""}>{o.isCorrect ? "✓ " : "· "}{o.text}</li>
                        ))}
                      </ul>
                      {q.explanation ? <p className="mt-1 text-xs text-muted-foreground">Explanation: {q.explanation}</p> : null}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button size="sm" disabled={pending} onClick={() => start(async () => { await setQuestionReview(q.id, examId, "APPROVED"); refresh(); })}>
                        <Check className="size-4" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" disabled={pending} onClick={() => start(async () => { await setQuestionReview(q.id, examId, "REJECTED"); refresh(); })}>
                        <X className="size-4" /> Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <p className="mb-2 text-sm font-medium">Approved questions ({approved.length})</p>
        <div className="space-y-2">
          {approved.map((q) =>
            editingId === q.id ? (
              <QuestionEditor
                key={q.id}
                examId={examId}
                question={q}
                onDone={() => { setEditingId(null); refresh(); }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <Card key={q.id}>
                <CardContent className="flex items-start justify-between gap-2 p-4">
                  <div>
                    <p className="text-sm font-medium">{q.prompt}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {q.type} · {q.points} pt{q.points === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setEditingId(q.id)}><Pencil className="size-4" /></Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => { if (confirm("Delete this question?")) start(async () => { await deleteQuestion(q.id, examId); refresh(); }); }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ),
          )}
        </div>
      </div>

      {adding ? (
        <QuestionEditor examId={examId} onDone={() => { setAdding(false); refresh(); }} onCancel={() => setAdding(false)} />
      ) : (
        <Button variant="outline" onClick={() => setAdding(true)}>
          <Plus className="size-4" /> Add question
        </Button>
      )}
    </div>
  );
}

function QuestionEditor({
  examId, question, onDone, onCancel,
}: {
  examId: string;
  question?: QuestionRow;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(
    question
      ? {
          type: question.type, prompt: question.prompt, explanation: question.explanation ?? "",
          points: question.points, difficulty: question.difficulty ?? "medium", topic: "",
          options: question.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect })),
        }
      : emptyForm(),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setType(type: QType) {
    setForm((f) => ({
      ...f,
      type,
      options: type === "TRUE_FALSE"
        ? [{ text: "True", isCorrect: true }, { text: "False", isCorrect: false }]
        : NEEDS_OPTIONS.has(type) ? f.options : [],
    }));
  }

  function updateOption(i: number, patch: Partial<OptionRow>) {
    setForm((f) => ({ ...f, options: f.options.map((o, idx) => (idx === i ? { ...o, ...patch } : o)) }));
  }

  async function handleSave() {
    if (form.prompt.trim().length < 3) { setError("Enter the question prompt."); return; }
    if (NEEDS_OPTIONS.has(form.type) && !form.options.some((o) => o.isCorrect)) {
      setError("Mark at least one option as correct.");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = { ...form, options: NEEDS_OPTIONS.has(form.type) ? form.options.filter((o) => o.text.trim()) : [] };
    const res = question ? await updateQuestion(question.id, examId, payload) : await createQuestion(examId, payload);
    setSaving(false);
    if (!res.ok) setError(res.error);
    else onDone();
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">Type</Label>
            <select value={form.type} onChange={(e) => setType(e.target.value as QType)} className="h-9 w-full rounded-md border border-input bg-card px-2 text-sm">
              <option value="MULTIPLE_CHOICE">Multiple choice</option>
              <option value="TRUE_FALSE">True / False</option>
              <option value="MULTIPLE_ANSWER">Multiple answer</option>
              <option value="SHORT_ANSWER">Short answer</option>
              <option value="ESSAY">Essay</option>
              <option value="SCENARIO">Scenario</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Points</Label>
            <Input type="number" min={1} value={form.points} onChange={(e) => setForm((f) => ({ ...f, points: Number(e.target.value) }))} className="h-9" />
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Prompt</Label>
          <textarea
            value={form.prompt}
            onChange={(e) => setForm((f) => ({ ...f, prompt: e.target.value }))}
            rows={2}
            className="flex w-full rounded-md border border-input bg-card px-2 py-1.5 text-sm"
          />
        </div>

        {NEEDS_OPTIONS.has(form.type) ? (
          <div className="space-y-2">
            <Label className="text-xs">Options — check the correct one(s)</Label>
            {form.options.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="checkbox" checked={o.isCorrect} onChange={(e) => updateOption(i, { isCorrect: e.target.checked })} className="size-4" />
                <Input value={o.text} onChange={(e) => updateOption(i, { text: e.target.value })} className="h-8" disabled={form.type === "TRUE_FALSE"} />
                {form.type !== "TRUE_FALSE" ? (
                  <Button size="icon" variant="ghost" className="size-8 shrink-0" onClick={() => setForm((f) => ({ ...f, options: f.options.filter((_, idx) => idx !== i) }))}>
                    <X className="size-3.5" />
                  </Button>
                ) : null}
              </div>
            ))}
            {form.type !== "TRUE_FALSE" && form.options.length < 8 ? (
              <Button size="sm" variant="outline" onClick={() => setForm((f) => ({ ...f, options: [...f.options, { text: "", isCorrect: false }] }))}>
                <Plus className="size-3.5" /> Add option
              </Button>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-1">
          <Label className="text-xs">Explanation (shown with results)</Label>
          <Input value={form.explanation} onChange={(e) => setForm((f) => ({ ...f, explanation: e.target.value }))} className="h-8" />
        </div>

        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : "Save question"}</Button>
          <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );
}
