"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CopyLinkButton } from "@/components/ui/copy-link-button";
import { deleteClips, publishClips, unpublishClip } from "./actions";

export interface ClipRow {
  id: string;
  slug: string;
  title: string;
  company: string;
  location: string | null;
  locationType: string;
  salaryText: string | null;
  sourceName: string | null;
  applyUrl: string;
  clippedAgo: string;
  excerpt: string;
  liveUrl: string;
  shareUrl: string;
}

function Row({
  job,
  mode,
  checked,
  onCheck,
  onDone,
  setMsg,
}: {
  job: ClipRow;
  mode: "waiting" | "live";
  checked: boolean;
  onCheck: () => void;
  onDone: () => void;
  setMsg: (m: { ok: boolean; text: string } | null) => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);

  async function run(label: string, fn: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    if (label === "delete" && !confirm(`Delete “${job.title}”? This can't be undone.`)) return;
    setBusy(label);
    setMsg(null);
    const res = await fn();
    setBusy(null);
    if (!res.ok) return setMsg({ ok: false, text: res.error ?? "Something went wrong." });
    setMsg({ ok: true, text: success });
    onDone();
  }

  return (
    <li className="flex gap-3 p-4">
      {mode === "waiting" ? (
        <input type="checkbox" className="mt-1.5 size-4 shrink-0" checked={checked} onChange={onCheck} aria-label={`Select ${job.title}`} />
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium leading-snug">{job.title}</p>
            <p className="text-sm text-muted-foreground">
              {job.company}
              {job.location ? ` · ${job.location}` : ""} · {job.locationType.toLowerCase()}
              {job.salaryText ? ` · ${job.salaryText.slice(0, 50)}` : ""}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {job.sourceName ? `from ${job.sourceName} · ` : ""}clipped {job.clippedAgo}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {mode === "waiting" ? (
              <>
                <Button size="sm" disabled={busy !== null} onClick={() => run("publish", () => publishClips([job.id]), `Published “${job.title}”.`)}>
                  {busy === "publish" ? <Loader2 className="size-3.5 animate-spin" /> : null} Publish
                </Button>
                <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => run("delete", () => deleteClips([job.id]), "Discarded.")}>
                  {busy === "delete" ? <Loader2 className="size-3.5 animate-spin" /> : null} Discard
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="outline" asChild>
                  <Link href={job.liveUrl} target="_blank">View live</Link>
                </Button>
                <CopyLinkButton url={job.shareUrl} />
                <Button size="sm" variant="ghost" disabled={busy !== null} onClick={() => run("unpublish", () => unpublishClip(job.id), "Moved back to waiting.")}>
                  Unpublish
                </Button>
                <Button size="sm" variant="ghost" disabled={busy !== null} onClick={() => run("delete", () => deleteClips([job.id]), "Deleted.")}>
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>

        <details className="group mt-2">
          <summary className="cursor-pointer text-xs text-primary hover:underline">
            <span className="group-open:hidden">Read the clipped text</span>
            <span className="hidden group-open:inline">Hide the clipped text</span>
          </summary>
          <p className="mt-2 max-h-72 overflow-y-auto whitespace-pre-line rounded-md border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
            {job.excerpt}
          </p>
        </details>

        <p className="mt-2 flex items-center gap-4 text-xs">
          <a href={job.applyUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
            Open the original <ExternalLink className="size-3" />
          </a>
          <Link href={`/admin/jobs/${job.id}`} className="inline-flex items-center gap-1 text-primary hover:underline">
            Edit details <Pencil className="size-3" />
          </Link>
        </p>
      </div>
    </li>
  );
}

export function ClipList({ jobs, mode }: { jobs: ClipRow[]; mode: "waiting" | "live" }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<"publish" | "delete" | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const all = jobs.length > 0 && selected.size === jobs.length;
  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  async function bulk(kind: "publish" | "delete") {
    if (kind === "delete" && !confirm(`Discard ${selected.size} job(s)?`)) return;
    setBusy(kind);
    setMsg(null);
    const res = kind === "publish" ? await publishClips([...selected]) : await deleteClips([...selected]);
    setBusy(null);
    if (!res.ok) return setMsg({ ok: false, text: res.error });
    setMsg({ ok: true, text: `${kind === "publish" ? "Published" : "Discarded"} ${res.data.count}.` });
    setSelected(new Set());
    router.refresh();
  }

  return (
    <div>
      {mode === "waiting" && jobs.length > 1 ? (
        <div className="flex flex-wrap items-center gap-3 border-b bg-muted/30 px-4 py-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="size-4" checked={all} onChange={() => setSelected(all ? new Set() : new Set(jobs.map((j) => j.id)))} />
            Select all
          </label>
          <span className="text-sm text-muted-foreground">{selected.size} selected</span>
          <div className="ml-auto flex gap-2">
            <Button size="sm" disabled={selected.size === 0 || busy !== null} onClick={() => bulk("publish")}>
              {busy === "publish" ? <Loader2 className="size-3.5 animate-spin" /> : null} Publish selected
            </Button>
            <Button size="sm" variant="outline" disabled={selected.size === 0 || busy !== null} onClick={() => bulk("delete")}>
              Discard selected
            </Button>
          </div>
        </div>
      ) : null}
      {msg ? (
        <div className="px-4 pt-3">
          <Alert variant={msg.ok ? "success" : "destructive"}><AlertDescription>{msg.text}</AlertDescription></Alert>
        </div>
      ) : null}
      <ul className="divide-y">
        {jobs.map((j) => (
          <Row
            key={j.id}
            job={j}
            mode={mode}
            checked={selected.has(j.id)}
            onCheck={() => toggle(j.id)}
            onDone={() => router.refresh()}
            setMsg={setMsg}
          />
        ))}
      </ul>
    </div>
  );
}
