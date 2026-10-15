"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Lightbulb, Loader2, PartyPopper, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { renderMarkdown } from "@/lib/markdown";
import { enhancePlaygrounds } from "@/components/lesson/playground";
import { splitSteps, type StepCheck } from "@/lib/course/steps";

/**
 * A text lesson taught one topic at a time. Each part must be finished
 * (questions answered right, or the live code edited, or a tap on "Got it")
 * before the next one opens; the last screen recaps the key points and
 * completes the lesson.
 */
export function StepLesson({
  content,
  alreadyCompleted,
  finishing,
  onFinish,
}: {
  content: string;
  alreadyCompleted: boolean;
  finishing: boolean;
  onFinish: () => void;
}) {
  const steps = useMemo(() => splitSteps(content), [content]);
  const [index, setIndex] = useState(0);
  const [acked, setAcked] = useState<Record<number, boolean>>({});
  const [edited, setEdited] = useState<Record<number, boolean>>({});
  const [solved, setSolved] = useState<Record<string, boolean>>({});
  const bodyRef = useRef<HTMLDivElement>(null);

  const total = steps.length;
  const onRecap = index >= total;
  const step = steps[index];

  // Students who finished this lesson before may roam freely; everyone else is gated.
  const free = alreadyCompleted;

  const partReady = (i: number) => {
    const s = steps[i];
    if (!s) return true;
    if (s.checks.length === 0 && !s.hasPlayground) return Boolean(acked[i]);
    const questionsOk = s.checks.every((_, c) => solved[`${i}:${c}`]);
    return questionsOk && (!s.hasPlayground || Boolean(edited[i]));
  };

  // Make the part's live-code boxes work, and notice when the student edits one.
  useEffect(() => {
    const root = bodyRef.current;
    if (!root) return;
    enhancePlaygrounds(root);
    const onEdit = () => setEdited((e) => ({ ...e, [index]: true }));
    root.addEventListener("cf-edit", onEdit);
    return () => root.removeEventListener("cf-edit", onEdit);
  }, [index]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [index]);

  if (total === 0) {
    return <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">No content yet.</div>;
  }

  const allKeyPoints = steps.flatMap((s) => s.keyPoints);
  const percent = Math.round(((onRecap ? total : index) / total) * 100);
  const ready = free || partReady(index);

  return (
    <div>
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>{onRecap ? "All done!" : `Part ${index + 1} of ${total}`}</span>
          <span>{percent}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-fuchsia-500 transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
        <ol className="mt-3 flex flex-wrap gap-1.5" aria-label="Lesson parts">
          {steps.map((s, i) => {
            const finished = i < index || onRecap;
            return (
              <li key={i}>
                <button
                  type="button"
                  disabled={!free && i > index}
                  onClick={() => setIndex(i)}
                  title={s.title}
                  aria-current={i === index && !onRecap ? "step" : undefined}
                  className={cn(
                    "grid size-7 place-items-center rounded-full border text-xs font-semibold transition",
                    i === index && !onRecap
                      ? "border-primary bg-primary text-primary-foreground shadow"
                      : finished
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "text-muted-foreground disabled:opacity-40",
                  )}
                >
                  {finished && !(i === index && !onRecap) ? <Check className="size-3.5" /> : i + 1}
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {onRecap ? (
        <div key="recap" className="cf-rise rounded-2xl border bg-card p-6 text-center sm:p-8">
          <div className="mx-auto mb-3 grid size-14 place-items-center rounded-full bg-primary/10 text-primary">
            <PartyPopper className="size-7" />
          </div>
          <h2 className="font-display text-xl font-semibold">You finished every part!</h2>
          {allKeyPoints.length > 0 ? (
            <div className="mx-auto mt-4 max-w-xl text-left">
              <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                <Lightbulb className="size-4 text-amber-500" /> Remember these
              </p>
              <ul className="space-y-2">
                {allKeyPoints.map((k, i) => (
                  <li
                    key={i}
                    className="cf-rise rounded-lg border bg-muted/40 px-3 py-2 text-sm [&_code]:rounded [&_code]:bg-background [&_code]:px-1 [&_code]:font-mono [&_code]:text-xs"
                    style={{ animationDelay: `${i * 60}ms` }}
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(k).replace(/^<p>|<\/p>$/g, "") }}
                  />
                ))}
              </ul>
            </div>
          ) : null}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button variant="outline" onClick={() => setIndex(0)}>
              Review from the start
            </Button>
            {alreadyCompleted ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                <CheckCircle2 className="size-4" /> Lesson completed
              </span>
            ) : (
              <Button onClick={onFinish} disabled={finishing}>
                {finishing ? <Loader2 className="size-4 animate-spin" /> : null}
                Complete lesson
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div key={index} className="cf-rise overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="border-b bg-gradient-to-r from-primary/10 via-fuchsia-500/10 to-transparent px-5 py-4 sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Part {index + 1}</p>
            <h2 className="mt-0.5 font-display text-xl font-semibold leading-snug">{step.title}</h2>
          </div>

          <div className="space-y-5 p-5 sm:p-6">
            <div ref={bodyRef} className="cf-prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(step.body) }} />

            {step.hasPlayground && !free && !edited[index] ? (
              <p className="rounded-lg border border-dashed border-primary/50 bg-primary/5 px-3 py-2 text-sm text-primary">
                ✏️ Change something in the code box above to unlock the next part.
              </p>
            ) : null}

            {step.checks.map((c, ci) => (
              <QuickCheck
                key={`${index}:${ci}`}
                check={c}
                number={step.checks.length > 1 ? ci + 1 : null}
                solved={Boolean(solved[`${index}:${ci}`]) || free}
                onSolved={() => setSolved((r) => ({ ...r, [`${index}:${ci}`]: true }))}
              />
            ))}
          </div>

          <div className="flex items-center justify-between gap-3 border-t bg-muted/30 px-5 py-3 sm:px-6">
            <Button variant="ghost" size="sm" onClick={() => setIndex(index - 1)} disabled={index === 0}>
              <ArrowLeft className="size-4" /> Back
            </Button>
            {step.checks.length === 0 && !step.hasPlayground && !free && !acked[index] ? (
              <Button size="sm" variant="outline" onClick={() => setAcked((d) => ({ ...d, [index]: true }))}>
                <Check className="size-4" /> Got it
              </Button>
            ) : (
              <span className="hidden text-xs text-muted-foreground sm:inline">
                {ready ? "Nice work — keep going!" : "Finish this part to continue"}
              </span>
            )}
            <Button size="sm" onClick={() => setIndex(index + 1)} disabled={!ready}>
              {index === total - 1 ? "Finish" : "Next part"} <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function QuickCheck({
  check,
  number,
  solved,
  onSolved,
}: {
  check: StepCheck;
  number: number | null;
  solved: boolean;
  onSolved: () => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const [tries, setTries] = useState(0);
  const correctIndex = check.options.findIndex((o) => o.correct);
  const shown = picked ?? (solved ? correctIndex : null);
  const isRight = solved && shown === correctIndex;

  return (
    <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
      <p className="mb-3 text-sm font-semibold">
        🎯 Quick check{number ? ` ${number}` : ""}: <span className="font-medium">{check.question}</span>
      </p>
      <div className="grid gap-2">
        {check.options.map((o, i) => {
          const chosen = shown === i;
          const good = chosen && o.correct;
          const bad = chosen && !o.correct;
          return (
            <button
              key={i}
              type="button"
              disabled={solved}
              onClick={() => {
                setPicked(i);
                if (o.correct) onSolved();
                else setTries((t) => t + 1);
              }}
              className={cn(
                "flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-left text-sm transition",
                !solved && "hover:border-primary hover:bg-primary/5",
                good && "cf-pop border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
                bad && "cf-shake border-red-400 bg-red-500/10 text-red-800 dark:text-red-300",
              )}
            >
              <span className="grid size-5 shrink-0 place-items-center rounded-full border text-[10px] font-bold">
                {good ? <Check className="size-3" /> : bad ? <X className="size-3" /> : String.fromCharCode(65 + i)}
              </span>
              <span className="font-mono text-[13px]">{o.text}</span>
            </button>
          );
        })}
      </div>
      {isRight ? (
        <p className="cf-rise mt-3 text-sm font-medium text-emerald-700 dark:text-emerald-400">
          ✅ Correct!{check.explain ? ` ${check.explain}` : ""}
        </p>
      ) : picked !== null ? (
        <p className="cf-rise mt-3 text-sm text-red-700 dark:text-red-400">
          Not quite{tries > 1 ? " — re-read this part above" : ""}. Try again!
        </p>
      ) : null}
    </div>
  );
}
