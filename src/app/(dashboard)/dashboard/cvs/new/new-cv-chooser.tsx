"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload, PencilLine, Sparkles, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { createCv, importCvFromUpload } from "../actions";

const TEXTAREA = "flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm";

type Template = { id: string; name: string; isPremium: boolean };

export function NewCvChooser({ templates }: { templates: Template[] }) {
  const [mode, setMode] = useState<"upload" | "blank">("upload");

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={cn(
            "rounded-lg border p-4 text-left transition",
            mode === "upload" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted",
          )}
        >
          <Upload className="size-5 text-primary" />
          <p className="mt-2 font-medium">Upload a CV</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            PDF or Word. We read it into the fields, then the AI can tailor it.
          </p>
        </button>
        <button
          type="button"
          onClick={() => setMode("blank")}
          className={cn(
            "rounded-lg border p-4 text-left transition",
            mode === "blank" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted",
          )}
        >
          <PencilLine className="size-5 text-primary" />
          <p className="mt-2 font-medium">Start blank</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Fill it in yourself from a template.</p>
        </button>
      </div>

      {mode === "upload" ? <UploadPath /> : <BlankPath templates={templates} />}
    </div>
  );
}

function UploadPath() {
  const router = useRouter();
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ id: string; notes: string[] } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await importCvFromUpload(new FormData(e.currentTarget));
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    if (res.data.notes.length) setResult(res.data);
    else router.push(`/dashboard/cvs/${res.data.id}`);
  }

  if (result) {
    return (
      <Card>
        <CardContent className="space-y-4 p-6">
          <p className="flex items-center gap-2 font-medium text-primary">
            <Sparkles className="size-4" /> CV imported
          </p>
          <p className="text-sm text-muted-foreground">
            Your details are in the fields now. A few things the AI wasn&apos;t sure about — check these when you open it.
            Nothing was invented.
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {result.notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
          <Button onClick={() => router.push(`/dashboard/cvs/${result.id}`)}>Open CV in the editor</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-4">
            <Label htmlFor="jobDescription" className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="size-4 text-primary" /> Target job — do this first
            </Label>
            <p className="text-xs text-muted-foreground">
              Paste the job advert you&apos;re applying for. We use it to build a fresh CV aimed at that
              role — reordering and rewording your real experience to match. Leave it blank to just import
              your CV as-is. It never invents anything.
            </p>
            <textarea
              id="jobDescription"
              name="jobDescription"
              rows={5}
              className={`${TEXTAREA} bg-card`}
              placeholder="e.g. paste the full 'Senior Data Analyst at Andela' advert — responsibilities, requirements, everything."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Your existing CV</Label>
            <label
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition",
                fileName
                  ? "border-primary bg-primary/10"
                  : "border-primary bg-primary/5 hover:bg-primary/15",
              )}
            >
              <span className="flex size-14 items-center justify-center rounded-full bg-primary/15 text-primary">
                {fileName ? <FileText className="size-6" /> : <Upload className="size-6" />}
              </span>
              {fileName ? (
                <>
                  <span className="text-base font-semibold">{fileName}</span>
                  <span className="text-sm text-primary underline">Choose a different file</span>
                </>
              ) : (
                <>
                  <span className="text-base font-bold text-foreground">Click to upload your CV</span>
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm">
                    <Upload className="size-4" /> Choose file
                  </span>
                  <span className="text-xs text-muted-foreground">PDF, Word (.docx) or text file — up to 5 MB</span>
                </>
              )}
              <input
                id="file"
                name="file"
                type="file"
                accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                className="hidden"
                onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
              />
            </label>
            <p className="text-xs text-muted-foreground">Scanned/image PDF? Paste the text below instead.</p>
          </div>

          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground">…or paste the CV text</summary>
            <textarea
              name="text"
              rows={7}
              className={`${TEXTAREA} mt-2`}
              placeholder="Paste the full text of your existing CV"
            />
          </details>

          <div className="space-y-2">
            <Label htmlFor="title">Name this CV (optional)</Label>
            <Input id="title" name="title" placeholder="e.g. Data Analyst — Andela" />
          </div>

          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <Button type="submit" size="lg" disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            {loading ? "Reading your CV…" : "Import CV"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Reading a CV into fields is free. Adding tailored details uses one AI credit.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

function BlankPath({ templates }: { templates: Template[] }) {
  const router = useRouter();
  const [templateId, setTemplateId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setLoading(true);
    setError(null);
    const res = await createCv(templateId || null);
    setLoading(false);
    if (!res.ok) setError(res.error);
    else router.push(`/dashboard/cvs/${res.data.id}`);
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="space-y-2">
          <Label htmlFor="template">Template</Label>
          <select
            id="template"
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
          >
            <option value="">No template (plain)</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
                {t.isPremium ? " (Premium)" : ""}
              </option>
            ))}
          </select>
        </div>
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <Button onClick={create} disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <PencilLine className="size-4" />}
          Create blank CV
        </Button>
      </CardContent>
    </Card>
  );
}
