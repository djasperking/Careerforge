"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { saveExamAnswer, recordSecurityEvent, submitExamAttempt } from "../../../actions";

interface OptionView { id: string; text: string }
interface QuestionView {
  id: string;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "MULTIPLE_ANSWER" | "SHORT_ANSWER" | "ESSAY" | "SCENARIO";
  prompt: string;
  points: number;
  options: OptionView[];
}
interface SavedAnswer { questionId: string; selectedOptionIds: string[]; textAnswer: string | null }

const MULTI = new Set(["MULTIPLE_CHOICE", "TRUE_FALSE", "MULTIPLE_ANSWER"]);

function formatClock(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function ExamRunner({
  attemptId, examTitle, deadlineIso, questions, savedAnswers,
}: {
  attemptId: string;
  examTitle: string;
  deadlineIso: string;
  questions: QuestionView[];
  savedAnswers: SavedAnswer[];
}) {
  const router = useRouter();
  const deadline = new Date(deadlineIso).getTime();
  const [remaining, setRemaining] = useState(() => Math.max(0, Math.round((deadline - Date.now()) / 1000)));
  const [answers, setAnswers] = useState<Record<string, { selectedOptionIds: string[]; textAnswer: string }>>(
    () =>
      Object.fromEntries(
        savedAnswers.map((a) => [a.questionId, { selectedOptionIds: a.selectedOptionIds, textAnswer: a.textAnswer ?? "" }]),
      ),
  );
  const [warning, setWarning] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmingSubmit, setConfirmingSubmit] = useState(false);
  const submittedRef = useRef(false);

  const doSubmit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    await submitExamAttempt(attemptId);
    router.refresh();
  }, [attemptId, router]);

  // Countdown — the server's serverDeadline is authoritative; this is just the display.
  useEffect(() => {
    const t = setInterval(() => {
      const left = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) {
        clearInterval(t);
        doSubmit();
      }
    }, 1000);
    return () => clearInterval(t);
  }, [deadline, doSubmit]);

  // Anti-cheating signals — deterrent + audit trail, not a guarantee. All
  // grading rules are still enforced server-side.
  useEffect(() => {
    const lastSent: Record<string, number> = {};
    function flag(type: string, message: string) {
      const now = Date.now();
      if (now - (lastSent[type] ?? 0) < 4000) return;
      lastSent[type] = now;
      recordSecurityEvent(attemptId, type);
      setWarning(message);
    }
    const onVisibility = () => { if (document.hidden) flag("TAB_SWITCH", "Tab switch detected and logged."); };
    const onBlur = () => flag("FOCUS_LOSS", "Window focus loss detected and logged.");
    const onCopy = (e: ClipboardEvent) => { e.preventDefault(); flag("COPY", "Copying is disabled during the exam."); };
    const onPaste = (e: ClipboardEvent) => { e.preventDefault(); flag("PASTE", "Pasting is disabled during the exam."); };
    const onContextMenu = (e: MouseEvent) => { e.preventDefault(); flag("RIGHT_CLICK", "Right-click is disabled during the exam."); };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    document.addEventListener("copy", onCopy);
    document.addEventListener("paste", onPaste);
    document.addEventListener("contextmenu", onContextMenu);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("contextmenu", onContextMenu);
    };
  }, [attemptId]);

  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  function updateAnswer(questionId: string, patch: Partial<{ selectedOptionIds: string[]; textAnswer: string }>) {
    setAnswers((prev) => {
      const base = prev[questionId] ?? { selectedOptionIds: [], textAnswer: "" };
      const next = { ...prev, [questionId]: { ...base, ...patch } };
      clearTimeout(saveTimers.current[questionId]);
      saveTimers.current[questionId] = setTimeout(() => {
        saveExamAnswer({ attemptId, questionId, ...next[questionId] });
      }, 600);
      return next;
    });
  }

  function toggleOption(question: QuestionView, optionId: string) {
    const current = answers[question.id]?.selectedOptionIds ?? [];
    if (question.type === "MULTIPLE_ANSWER") {
      const next = current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId];
      updateAnswer(question.id, { selectedOptionIds: next });
    } else {
      updateAnswer(question.id, { selectedOptionIds: [optionId] });
    }
  }

  const answeredCount = questions.filter((q) => {
    const a = answers[q.id];
    return a && (a.selectedOptionIds.length > 0 || a.textAnswer.trim().length > 0);
  }).length;

  return (
    <div className="mx-auto max-w-3xl pb-24">
      <div className="sticky top-0 z-10 -mx-4 mb-6 border-b bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-display text-lg font-semibold">{examTitle}</p>
            <p className="text-xs text-muted-foreground">{answeredCount}/{questions.length} answered</p>
          </div>
          <div className={`font-display text-2xl font-semibold tabular-nums ${remaining < 60 ? "text-destructive" : ""}`}>
            {formatClock(remaining)}
          </div>
        </div>
      </div>

      {warning ? (
        <Alert variant="warning" className="mb-4">
          <AlertTriangle className="size-4" />
          <AlertDescription>{warning}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-4" onContextMenu={(e) => e.preventDefault()}>
        {questions.map((q, i) => (
          <Card key={q.id}>
            <CardContent className="p-5">
              <p className="text-sm font-medium">
                {i + 1}. {q.prompt} <span className="text-xs font-normal text-muted-foreground">({q.points} pt{q.points === 1 ? "" : "s"})</span>
              </p>

              {MULTI.has(q.type) ? (
                <div className="mt-3 space-y-2">
                  {q.options.map((o) => (
                    <label key={o.id} className="flex items-center gap-2 rounded-md border p-2 text-sm hover:bg-muted">
                      <input
                        type={q.type === "MULTIPLE_ANSWER" ? "checkbox" : "radio"}
                        name={q.id}
                        checked={(answers[q.id]?.selectedOptionIds ?? []).includes(o.id)}
                        onChange={() => toggleOption(q, o.id)}
                        onCopy={(e) => e.preventDefault()}
                        onPaste={(e) => e.preventDefault()}
                        className="size-4"
                      />
                      {o.text}
                    </label>
                  ))}
                </div>
              ) : (
                <textarea
                  value={answers[q.id]?.textAnswer ?? ""}
                  onChange={(e) => updateAnswer(q.id, { textAnswer: e.target.value })}
                  onCopy={(e) => e.preventDefault()}
                  onPaste={(e) => e.preventDefault()}
                  rows={4}
                  placeholder="Type your answer…"
                  className="mt-3 flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t bg-background/95 p-4 backdrop-blur">
        <div className="mx-auto flex max-w-3xl justify-end">
          {confirmingSubmit ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Submit? You can&apos;t change answers after this.</span>
              <Button size="sm" variant="outline" onClick={() => setConfirmingSubmit(false)}>Cancel</Button>
              <Button size="sm" disabled={submitting} onClick={doSubmit}>
                {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
                Yes, submit
              </Button>
            </div>
          ) : (
            <Button size="lg" disabled={submitting} onClick={() => setConfirmingSubmit(true)}>
              Submit exam
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
