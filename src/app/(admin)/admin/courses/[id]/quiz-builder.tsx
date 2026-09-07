"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getLessonQuizAction, saveLessonQuizAction, deleteLessonQuizAction } from "../actions";

type QType = "MULTIPLE_CHOICE" | "TRUE_FALSE" | "MULTIPLE_ANSWER";
type Option = { text: string; isCorrect: boolean };
type Question = { prompt: string; type: QType; explanation: string; points: number; options: Option[] };

const blankQuestion = (type: QType = "MULTIPLE_CHOICE"): Question => ({
  prompt: "",
  type,
  explanation: "",
  points: 1,
  options:
    type === "TRUE_FALSE"
      ? [
          { text: "True", isCorrect: true },
          { text: "False", isCorrect: false },
        ]
      : [
          { text: "", isCorrect: true },
          { text: "", isCorrect: false },
        ],
});

export function QuizBuilder({ lessonId, courseId }: { lessonId: string; courseId: string }) {
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("Lesson quiz");
  const [passingScore, setPassingScore] = useState(70);
  const [maxAttempts, setMaxAttempts] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([blankQuestion()]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    let alive = true;
    getLessonQuizAction(lessonId, courseId).then((res) => {
      if (!alive) return;
      if (res.ok && res.data) {
        setTitle(res.data.title);
        setPassingScore(res.data.passingScore);
        setMaxAttempts(res.data.maxAttempts);
        setQuestions(
          res.data.questions.map((q) => ({
            prompt: q.prompt,
            type: (["MULTIPLE_CHOICE", "TRUE_FALSE", "MULTIPLE_ANSWER"].includes(q.type)
              ? q.type
              : "MULTIPLE_CHOICE") as QType,
            explanation: q.explanation ?? "",
            points: q.points,
            options: q.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect })),
          })),
        );
      }
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [lessonId, courseId]);

  function updateQuestion(qi: number, patch: Partial<Question>) {
    setQuestions((qs) => qs.map((q, i) => (i === qi ? { ...q, ...patch } : q)));
  }

  function setType(qi: number, type: QType) {
    setQuestions((qs) => qs.map((q, i) => (i === qi ? { ...blankQuestion(type), prompt: q.prompt, explanation: q.explanation, points: q.points } : q)));
  }

  function toggleCorrect(qi: number, oi: number) {
    setQuestions((qs) =>
      qs.map((q, i) => {
        if (i !== qi) return q;
        const single = q.type !== "MULTIPLE_ANSWER";
        return {
          ...q,
          options: q.options.map((o, j) => ({
            ...o,
            isCorrect: j === oi ? (single ? true : !o.isCorrect) : single ? false : o.isCorrect,
          })),
        };
      }),
    );
  }

  function setOptionText(qi: number, oi: number, text: string) {
    setQuestions((qs) =>
      qs.map((q, i) => (i === qi ? { ...q, options: q.options.map((o, j) => (j === oi ? { ...o, text } : o)) } : q)),
    );
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    const res = await saveLessonQuizAction(lessonId, courseId, { title, passingScore, maxAttempts, questions });
    setSaving(false);
    setMsg(res.ok ? { ok: true, text: "Quiz saved." } : { ok: false, text: res.error });
  }

  async function removeQuiz() {
    if (!confirm("Delete this quiz and all its questions?")) return;
    setSaving(true);
    await deleteLessonQuizAction(lessonId, courseId);
    setSaving(false);
    setTitle("Lesson quiz");
    setPassingScore(70);
    setMaxAttempts(0);
    setQuestions([blankQuestion()]);
    setMsg({ ok: true, text: "Quiz removed." });
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading quiz…
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-md border bg-muted/30 p-3">
      <p className="text-xs font-medium">Quiz</p>
      <div className="grid gap-2 sm:grid-cols-3">
        <div className="space-y-1">
          <Label className="text-xs">Quiz title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-8" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Pass mark (%)</Label>
          <Input
            type="number"
            min={1}
            max={100}
            value={passingScore}
            onChange={(e) => setPassingScore(Math.max(1, Math.min(100, Number(e.target.value))))}
            className="h-8"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Max attempts (0 = unlimited)</Label>
          <Input
            type="number"
            min={0}
            max={20}
            value={maxAttempts}
            onChange={(e) => setMaxAttempts(Math.max(0, Math.min(20, Number(e.target.value))))}
            className="h-8"
          />
        </div>
      </div>

      {questions.map((q, qi) => (
        <div key={qi} className="space-y-2 rounded-md border bg-card p-3">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">Question {qi + 1}</span>
            <button
              type="button"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => setQuestions((qs) => qs.filter((_, i) => i !== qi))}
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
          <textarea
            value={q.prompt}
            onChange={(e) => updateQuestion(qi, { prompt: e.target.value })}
            rows={2}
            placeholder="Question prompt"
            className="flex w-full rounded-md border border-input bg-card px-2 py-1.5 text-sm"
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Type</Label>
              <select
                value={q.type}
                onChange={(e) => setType(qi, e.target.value as QType)}
                className="h-8 w-full rounded-md border border-input bg-card px-2 text-sm"
              >
                <option value="MULTIPLE_CHOICE">Multiple choice (one answer)</option>
                <option value="MULTIPLE_ANSWER">Multiple answer (checkboxes)</option>
                <option value="TRUE_FALSE">True / false</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Points</Label>
              <Input
                type="number"
                min={1}
                max={20}
                value={q.points}
                onChange={(e) => updateQuestion(qi, { points: Math.max(1, Math.min(20, Number(e.target.value))) })}
                className="h-8"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">
              Options — {q.type === "MULTIPLE_ANSWER" ? "tick every correct answer" : "tick the correct answer"}
            </Label>
            {q.options.map((o, oi) => (
              <div key={oi} className="flex items-center gap-2">
                <input
                  type={q.type === "MULTIPLE_ANSWER" ? "checkbox" : "radio"}
                  name={`correct-${qi}`}
                  checked={o.isCorrect}
                  onChange={() => toggleCorrect(qi, oi)}
                  className="size-4 shrink-0"
                />
                <Input
                  value={o.text}
                  onChange={(e) => setOptionText(qi, oi, e.target.value)}
                  disabled={q.type === "TRUE_FALSE"}
                  className="h-8"
                  placeholder={`Option ${oi + 1}`}
                />
                {q.type !== "TRUE_FALSE" && q.options.length > 2 ? (
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() =>
                      setQuestions((qs) =>
                        qs.map((qq, i) => (i === qi ? { ...qq, options: qq.options.filter((_, j) => j !== oi) } : qq)),
                      )
                    }
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                ) : null}
              </div>
            ))}
            {q.type !== "TRUE_FALSE" && q.options.length < 8 ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() =>
                  setQuestions((qs) =>
                    qs.map((qq, i) => (i === qi ? { ...qq, options: [...qq.options, { text: "", isCorrect: false }] } : qq)),
                  )
                }
              >
                <Plus className="size-3.5" /> Add option
              </Button>
            ) : null}
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Explanation shown after answering (optional)</Label>
            <Input
              value={q.explanation}
              onChange={(e) => updateQuestion(qi, { explanation: e.target.value })}
              className="h-8"
            />
          </div>
        </div>
      ))}

      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setQuestions((qs) => [...qs, blankQuestion()])}
      >
        <Plus className="size-4" /> Add question
      </Button>

      {msg ? (
        <p className={`text-xs ${msg.ok ? "text-success" : "text-destructive"}`}>{msg.text}</p>
      ) : null}

      <div className="flex gap-2">
        <Button type="button" size="sm" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : null} Save quiz
        </Button>
        <Button type="button" size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={removeQuiz} disabled={saving}>
          Delete quiz
        </Button>
      </div>
    </div>
  );
}
