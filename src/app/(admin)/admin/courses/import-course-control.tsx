"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload, FileText, Sparkles, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { importCourseFromDocument } from "./actions";

export function ImportCourseControl() {
  const router = useRouter();
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<
    { id: string; notes: string[]; modules: number; lessons: number } | null
  >(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await importCourseFromDocument(new FormData(e.currentTarget));
    setLoading(false);
    if (!res.ok) setError(res.error);
    else setResult(res.data);
  }

  return (
    <details className="group mb-6 rounded-lg border border-primary/40 bg-card shadow-[0_0_14px_-3px_hsl(var(--cf-primary)/0.35)]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 p-4 hover:bg-primary/5">
        <span className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <span className="font-display text-base font-semibold">Import a course from a document</span>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            — upload a syllabus and we build the outline
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1 rounded-full border border-primary/40 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
          <span className="group-open:hidden">Open</span>
          <span className="hidden group-open:inline">Close</span>
          <ChevronRight className="size-3.5 transition-transform group-open:rotate-90" />
        </span>
      </summary>

      <div className="border-t p-4">
        {result ? (
          <div className="space-y-3">
            <p className="flex items-center gap-2 font-medium text-primary">
              <Sparkles className="size-4" /> Draft course created
            </p>
            <p className="text-sm text-muted-foreground">
              {result.modules} module{result.modules === 1 ? "" : "s"} · {result.lessons} lesson
              {result.lessons === 1 ? "" : "s"}. It&apos;s a private draft — review and add media in the builder.
            </p>
            {result.notes.length ? (
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {result.notes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            ) : null}
            <div className="flex gap-2">
              <Button onClick={() => router.push(`/admin/courses/${result.id}`)}>Open course builder</Button>
              <Button variant="ghost" onClick={() => { setResult(null); setFileName(null); }}>
                Import another
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <label
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition",
                fileName ? "border-primary bg-primary/10" : "border-primary bg-primary/5 hover:bg-primary/15",
              )}
            >
              <span className="flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary">
                {fileName ? <FileText className="size-5" /> : <Upload className="size-5" />}
              </span>
              {fileName ? (
                <span className="text-sm font-semibold">{fileName}</span>
              ) : (
                <span className="text-sm font-bold">Click to upload a syllabus or outline</span>
              )}
              <span className="text-xs text-muted-foreground">
                PDF, Word (.docx) or plain text — up to 5 MB. We read the topics, sections and any lesson text.
              </span>
              <input
                type="file"
                name="file"
                accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                className="hidden"
                onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
              />
            </label>

            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground">…or paste the outline text</summary>
              <textarea
                name="text"
                rows={7}
                className="mt-2 flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
                placeholder="Paste your syllabus, course outline or lesson plan"
              />
            </details>

            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              {loading ? "Reading the document…" : "Build course outline"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Creates a private draft. Nothing is published and no lesson content is invented — only text
              that&apos;s in your document is used.
            </p>
          </form>
        )}
      </div>
    </details>
  );
}
