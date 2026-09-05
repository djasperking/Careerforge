"use client";

import { useState } from "react";
import { Loader2, Sparkles, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { generateCoverLetterAction } from "./actions";

export function CoverLetterTool({ cvs }: { cvs: { id: string; title: string }[] }) {
  const [cvId, setCvId] = useState(cvs[0]?.id ?? "");
  const [jobDescription, setJobDescription] = useState("");
  const [tone, setTone] = useState("professional");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [letter, setLetter] = useState<string | null>(null);

  async function handleGenerate() {
    if (!cvId) {
      setError("Create a CV first — the cover letter is drafted from it.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await generateCoverLetterAction({ cvId, jobDescription, tone });
    setLoading(false);
    if (!res.ok) setError(res.error);
    else setLetter(res.data.coverLetter);
  }

  if (cvs.length === 0) {
    return <p className="text-sm text-muted-foreground">Create a CV first — the cover letter generator drafts from your CV content.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>CV</Label>
          <select value={cvId} onChange={(e) => setCvId(e.target.value)} className="h-10 w-full rounded-md border border-input bg-card px-2 text-sm">
            {cvs.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Tone</Label>
          <select value={tone} onChange={(e) => setTone(e.target.value)} className="h-10 w-full rounded-md border border-input bg-card px-2 text-sm">
            <option value="professional">Professional</option>
            <option value="enthusiastic">Enthusiastic</option>
            <option value="concise">Concise</option>
          </select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Job description</Label>
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          rows={5}
          placeholder="Paste the job description here…"
          className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
        />
      </div>
      {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
      <Button onClick={handleGenerate} disabled={loading}>
        {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
        Generate cover letter
      </Button>

      {letter ? (
        <div className="rounded-md border border-primary/30 bg-primary/5 p-4">
          <div className="mb-2 flex items-center justify-between">
            <Badge>AI-generated — review before sending</Badge>
            <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(letter)}>
              <Copy className="size-3.5" /> Copy
            </Button>
          </div>
          <p className="whitespace-pre-wrap text-sm">{letter}</p>
        </div>
      ) : null}
    </div>
  );
}
