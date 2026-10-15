"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, ChevronDown, Circle, FileCode2, Loader2, RotateCcw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { mountEditor, type EditorHandle } from "./code-editor";
import { SitePreview } from "./site-preview";
import {
  composePreview,
  MAX_SUBMISSION_CHARS,
  serializeSubmission,
  totalChars,
  usesScripts,
  type CheckGroup,
  type WorkspaceFile,
} from "@/lib/course/workspace";
import { checkWebsite, summarize } from "@/lib/course/site-check";

/**
 * A mini code editor + live preview, so students can build and hand in a whole
 * website without leaving the lesson. The work is saved in the browser as they
 * type and submitted as plain text (see serializeSubmission).
 */
export function CodeWorkspace({
  starter,
  initial,
  checks,
  storageKey,
  busy,
  error,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  starter: WorkspaceFile[];
  /** Previously submitted work, if any. */
  initial: WorkspaceFile[];
  checks: CheckGroup[];
  storageKey: string;
  busy: boolean;
  error: string | null;
  submitLabel: string;
  onSubmit: (text: string) => void;
  onCancel?: () => void;
}) {
  const [files, setFiles] = useState<WorkspaceFile[]>(initial);
  const [loaded, setLoaded] = useState(false);

  // Pick up an unsent draft from this browser (after mount, so server and client render the same).
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as WorkspaceFile[];
        if (Array.isArray(parsed) && parsed.every((f) => typeof f?.name === "string" && typeof f?.code === "string")) {
          setFiles(starter.map((st) => ({ name: st.name, code: parsed.find((q) => q.name === st.name)?.code ?? st.code })));
        }
      }
    } catch {
      /* private mode or blocked storage — keep the submitted work */
    }
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);
  const [active, setActive] = useState(0);
  const [previewDoc, setPreviewDoc] = useState(() => composePreview(files));
  const [showChecks, setShowChecks] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const host = useRef<HTMLDivElement>(null);
  const editor = useRef<EditorHandle | null>(null);
  const filesRef = useRef(files);
  filesRef.current = files;

  // One editor instance, re-created when the student switches file.
  useEffect(() => {
    let cancelled = false;
    const file = filesRef.current[active];
    if (!loaded || !host.current || !file) return;
    mountEditor({
      parent: host.current,
      value: file.code,
      language: /\.css$/i.test(file.name) ? "css" : /\.js$/i.test(file.name) ? "js" : "html",
      label: `Code for ${file.name}`,
      onChange: (code) =>
        setFiles((prev) => prev.map((f, i) => (i === active ? { ...f, code } : f))),
    })
      .then((h) => {
        if (cancelled) h.destroy();
        else editor.current = h;
      })
      .catch(() => setLoadError(true));
    return () => {
      cancelled = true;
      editor.current?.destroy();
      editor.current = null;
    };
  }, [active, loaded]);

  // Debounced live preview + draft save.
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => {
      setPreviewDoc(composePreview(files));
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(files));
      } catch {
        /* storage unavailable — the draft just won't survive a refresh */
      }
    }, 300);
    return () => clearTimeout(t);
  }, [files, storageKey, loaded]);

  const results = useMemo(() => checkWebsite(files, checks), [files, checks]);
  const score = summarize(results);
  const size = totalChars(files);
  const tooBig = size > MAX_SUBMISSION_CHARS;
  const empty = !files.some((f) => f.code.trim());

  function resetFile() {
    if (!window.confirm(`Reset ${files[active].name} to the starting code? Your changes to this file will be lost.`)) return;
    const code = starter.find((s) => s.name === files[active].name)?.code ?? "";
    setFiles((prev) => prev.map((f, i) => (i === active ? { ...f, code } : f)));
    editor.current?.setValue(code);
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-2 py-1.5">
          <div role="tablist" className="flex gap-1">
            {files.map((f, i) => (
              <button
                key={f.name}
                role="tab"
                aria-selected={i === active}
                type="button"
                onClick={() => setActive(i)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition",
                  i === active ? "bg-background shadow-sm" : "text-muted-foreground hover:bg-background/60",
                )}
              >
                <FileCode2 className="size-3.5" /> {f.name}
              </button>
            ))}
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={resetFile}>
            <RotateCcw className="size-3.5" /> Reset file
          </Button>
        </div>

        <div className="grid lg:grid-cols-2">
          <div className="h-[26rem] overflow-hidden border-b lg:border-b-0 lg:border-r">
            <div ref={host} className="h-full" />
            {loadError ? (
              <p className="p-3 text-sm text-destructive">The editor couldn&apos;t load. Refresh the page and try again.</p>
            ) : null}
          </div>
          <div className="flex h-[26rem] flex-col">
            <div className="border-b bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground">
              Live preview — updates as you type
            </div>
            <div className="min-h-0 flex-1">
              <SitePreview html={previewDoc} scripts={usesScripts(files)} />
            </div>
          </div>
        </div>
      </div>

      {checks.length > 0 ? (
        <div className="rounded-xl border bg-card">
          <button
            type="button"
            aria-expanded={showChecks}
            onClick={() => setShowChecks((s) => !s)}
            className="flex w-full items-center gap-3 px-4 py-3 text-left"
          >
            <span className="flex-1">
              <span className="block text-sm font-semibold">
                ✅ Requirements checker — {score.passed} of {score.total} done
              </span>
              <span className="mt-1.5 block h-2 overflow-hidden rounded-full bg-muted">
                <span
                  className="block h-full rounded-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-500"
                  style={{ width: `${score.percent}%` }}
                />
              </span>
            </span>
            <ChevronDown className={cn("size-4 transition-transform", showChecks && "rotate-180")} />
          </button>
          {showChecks ? (
            <ul className="grid gap-x-6 gap-y-1.5 border-t px-4 py-3 sm:grid-cols-2">
              {results.map((r) => (
                <li key={r.id} className="flex items-start gap-2 text-sm">
                  {r.ok ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                  ) : (
                    <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground/60" />
                  )}
                  <span className={r.ok ? "text-muted-foreground line-through decoration-emerald-600/50" : ""}>
                    {r.label}
                    {!r.ok ? <span className="block text-xs text-muted-foreground">{r.hint}</span> : null}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          <p className="border-t px-4 py-2 text-xs text-muted-foreground">
            This checker looks for the things the course taught. Your instructor still reviews the design and the code.
          </p>
        </div>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {tooBig ? <p className="text-sm text-destructive">Your code is too long to submit — trim it a little.</p> : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={() => onSubmit(serializeSubmission(files))} disabled={busy || empty || tooBig}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          {submitLabel}
        </Button>
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <span className="text-xs text-muted-foreground">Your work saves in this browser as you type.</span>
      </div>
    </div>
  );
}
