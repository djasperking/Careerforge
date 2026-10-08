"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { reviewImportedJobs } from "../sources/actions";

export interface ReviewJob {
  id: string;
  title: string;
  company: string;
  location: string | null;
  locationType: string;
  sourceName: string | null;
  applyUrl: string;
  salaryText: string | null;
  snippet: string;
}

export function ReviewList({ jobs }: { jobs: ReviewJob[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<"publish" | "discard" | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const allSelected = jobs.length > 0 && selected.size === jobs.length;
  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  async function act(action: "publish" | "discard") {
    if (action === "discard" && !confirm(`Discard ${selected.size} job(s)? They won't be re-imported.`)) return;
    setBusy(action);
    setMsg(null);
    const res = await reviewImportedJobs([...selected], action);
    setBusy(null);
    if (!res.ok) return setMsg({ ok: false, text: res.error });
    setMsg({ ok: true, text: `${action === "publish" ? "Published" : "Discarded"} ${res.data.count}.` });
    setSelected(new Set());
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-4"
            checked={allSelected}
            onChange={() => setSelected(allSelected ? new Set() : new Set(jobs.map((j) => j.id)))}
          />
          Select all ({jobs.length})
        </label>
        <span className="text-sm text-muted-foreground">{selected.size} selected</span>
        <div className="ml-auto flex gap-2">
          <Button size="sm" disabled={selected.size === 0 || busy !== null} onClick={() => act("publish")}>
            {busy === "publish" ? <Loader2 className="size-4 animate-spin" /> : null} Publish selected
          </Button>
          <Button size="sm" variant="outline" disabled={selected.size === 0 || busy !== null} onClick={() => act("discard")}>
            {busy === "discard" ? <Loader2 className="size-4 animate-spin" /> : null} Discard selected
          </Button>
        </div>
      </div>
      {msg ? (
        <Alert variant={msg.ok ? "success" : "destructive"}><AlertDescription>{msg.text}</AlertDescription></Alert>
      ) : null}

      <ul className="space-y-2">
        {jobs.map((j) => (
          <li key={j.id} className="flex gap-3 rounded-lg border bg-card p-4">
            <input
              type="checkbox"
              className="mt-1 size-4 shrink-0"
              checked={selected.has(j.id)}
              onChange={() => toggle(j.id)}
              aria-label={`Select ${j.title}`}
            />
            <div className="min-w-0 flex-1">
              <p className="font-medium">{j.title}</p>
              <p className="text-sm text-muted-foreground">
                {j.company}
                {j.location ? ` · ${j.location}` : ""} · {j.locationType.toLowerCase()}
                {j.salaryText ? ` · ${j.salaryText}` : ""}
              </p>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{j.snippet}</p>
              <p className="mt-1 flex items-center gap-3 text-xs">
                <span className="text-muted-foreground">via {j.sourceName ?? "import"}</span>
                <a href={j.applyUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                  Check the original <ExternalLink className="size-3" />
                </a>
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
