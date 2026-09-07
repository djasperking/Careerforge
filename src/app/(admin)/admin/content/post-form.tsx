"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { renderMarkdown } from "@/lib/markdown";
import { createPost, updatePost } from "./actions";

const TA = "flex w-full rounded-md border border-input bg-card px-3 py-2 font-mono text-sm";

export type PostFormValues = {
  title: string;
  excerpt: string;
  category: string;
  coverUrl: string;
  body: string;
};

const EMPTY: PostFormValues = { title: "", excerpt: "", category: "", coverUrl: "", body: "" };

export function PostForm({ postId, initial }: { postId?: string; initial?: Partial<PostFormValues> }) {
  const router = useRouter();
  const [f, setF] = useState<PostFormValues>({ ...EMPTY, ...initial });
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const set = (k: keyof PostFormValues, v: string) => setF((s) => ({ ...s, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = postId ? await updatePost(postId, f) : await createPost(f);
    setBusy(false);
    if (!res.ok) return setMsg({ ok: false, text: res.error });
    if (postId) {
      setMsg({ ok: true, text: "Saved." });
      router.refresh();
    } else {
      router.push(`/admin/content/${(res.data as { id: string }).id}`);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={f.title} onChange={(e) => set("title", e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="category">Category</Label>
          <Input id="category" value={f.category} onChange={(e) => set("category", e.target.value)} placeholder="e.g. Getting Started" />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="excerpt">Excerpt (shown in the list)</Label>
        <Input id="excerpt" value={f.excerpt} onChange={(e) => set("excerpt", e.target.value)} maxLength={400} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="coverUrl">Cover image URL (optional)</Label>
        <Input id="coverUrl" type="url" value={f.coverUrl} onChange={(e) => set("coverUrl", e.target.value)} />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label htmlFor="body">Body (Markdown)</Label>
          <button type="button" onClick={() => setPreview((p) => !p)} className="text-xs font-medium text-primary hover:underline">
            {preview ? "Edit" : "Preview"}
          </button>
        </div>
        {preview ? (
          <div
            className="prose prose-sm max-w-none rounded-md border bg-card p-4"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(f.body || "_Nothing to preview._") }}
          />
        ) : (
          <textarea id="body" rows={18} className={TA} value={f.body} onChange={(e) => set("body", e.target.value)} required minLength={20} />
        )}
      </div>

      {msg ? <Alert variant={msg.ok ? "success" : "destructive"}><AlertDescription>{msg.text}</AlertDescription></Alert> : null}
      <Button type="submit" disabled={busy}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : null} {postId ? "Save changes" : "Create draft"}
      </Button>
    </form>
  );
}
