"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { importCvFromUpload } from "../actions";

const TEXTAREA = "flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm";

export function ImportCvForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<string[] | null>(null);
  const [newId, setNewId] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotes(null);
    const res = await importCvFromUpload(new FormData(e.currentTarget));
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    if (res.data.notes.length) {
      setNotes(res.data.notes);
      setNewId(res.data.id);
    } else {
      router.push(`/dashboard/cvs/${res.data.id}`);
    }
  }

  if (notes && newId) {
    return (
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center gap-2 font-medium text-primary">
            <Sparkles className="size-4" /> CV imported
          </div>
          <p className="text-sm text-muted-foreground">
            Review these notes from the AI, then open your CV to edit and export it. Nothing was
            invented — anything uncertain is flagged below.
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
          <Button onClick={() => router.push(`/dashboard/cvs/${newId}`)}>Open CV</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="file">Upload your current CV</Label>
        <Input
          id="file"
          name="file"
          type="file"
          accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
        />
        <p className="text-xs text-muted-foreground">
          PDF, Word (.docx) or plain text, up to 5 MB. {fileName ? `Selected: ${fileName}` : "Or paste the text below."}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="text">…or paste your CV text</Label>
        <textarea id="text" name="text" rows={8} className={TEXTAREA} placeholder="Paste the full text of your existing CV here" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="jobDescription">Target job description (optional)</Label>
        <textarea
          id="jobDescription"
          name="jobDescription"
          rows={6}
          className={TEXTAREA}
          placeholder="Paste the job advert. The AI will reorder and rephrase your real experience to match it — without inventing anything."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">CV name (optional)</Label>
        <Input id="title" name="title" placeholder="e.g. Product Manager — Paystack" />
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" disabled={loading} size="lg">
        {loading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
        {loading ? "Reading and tailoring…" : "Import CV"}
      </Button>
    </form>
  );
}
