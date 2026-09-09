"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ClipboardPaste, Sparkles, ChevronRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { importJobFromText } from "./actions";

export function PasteJobPanel() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [applyUrl, setApplyUrl] = useState("");
  const [publish, setPublish] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ id: string; slug: string; usedAI: boolean; published: boolean } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await importJobFromText({ text, applyUrl, publish, featured });
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setDone(res.data);
    router.refresh();
  }

  return (
    <details className="group rounded-lg border border-primary/40 bg-card shadow-[0_0_14px_-3px_hsl(var(--cf-primary)/0.35)]" open>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 p-4 hover:bg-primary/5">
        <span className="flex items-center gap-2">
          <ClipboardPaste className="size-4 text-primary" />
          <span className="font-display text-base font-semibold">Paste a job posting</span>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            — copy the details from any site, drop in the apply link
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1 rounded-full border border-primary/40 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
          <span className="group-open:hidden">Open</span>
          <span className="hidden group-open:inline">Close</span>
          <ChevronRight className="size-3.5 transition-transform group-open:rotate-90" />
        </span>
      </summary>

      <div className="border-t p-4">
        {done ? (
          <div className="space-y-3">
            <p className="flex items-center gap-2 font-medium text-primary">
              <Sparkles className="size-4" /> Job {done.published ? "published" : "saved as draft"}
            </p>
            <p className="text-sm text-muted-foreground">
              {done.usedAI
                ? "Parsed the posting into fields. Check the title, company and pay before it goes out."
                : "Saved with a quick automatic pass — open it and check every field."}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => router.push(`/admin/jobs/${done.id}`)}>Review / edit</Button>
              {done.published ? (
                <Button variant="outline" asChild>
                  <a href={`/jobs/${done.slug}`} target="_blank" rel="noreferrer">
                    View live <ExternalLink className="size-3.5" />
                  </a>
                </Button>
              ) : null}
              <Button
                variant="ghost"
                onClick={() => {
                  setDone(null);
                  setText("");
                  setApplyUrl("");
                }}
              >
                Paste another
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="job-text">Job details</Label>
              <textarea
                id="job-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={12}
                required
                placeholder="Paste everything from the job page — title, company, location, responsibilities, requirements, salary. Navigation and 'apply now' clutter is fine, we clean it up."
                className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="apply-url">Application link</Label>
              <Input
                id="apply-url"
                type="url"
                value={applyUrl}
                onChange={(e) => setApplyUrl(e.target.value)}
                required
                placeholder="https://… — where 'Apply' sends people (may be your referral link)"
              />
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} className="size-4" />
                Publish immediately
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="size-4" />
                Feature it
              </label>
            </div>

            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <ClipboardPaste className="size-4" />}
              {loading ? "Reading the posting…" : publish ? "Create & publish job" : "Save job as draft"}
            </Button>
          </form>
        )}
      </div>
    </details>
  );
}
