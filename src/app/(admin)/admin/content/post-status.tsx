"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { setPostStatus, deletePost } from "./actions";

export function PostStatusControls({ postId, status }: { postId: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(fn: () => Promise<{ ok: boolean; error?: string }>, go?: () => void) {
    setBusy(true);
    setError(null);
    const res = await fn();
    setBusy(false);
    if (!res.ok) setError(res.error ?? "Something went wrong.");
    else if (go) go();
    else router.refresh();
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {status !== "PUBLISHED" ? (
          <Button size="sm" disabled={busy} onClick={() => run(() => setPostStatus(postId, "PUBLISHED"))}>Publish</Button>
        ) : (
          <Button size="sm" variant="outline" disabled={busy} onClick={() => run(() => setPostStatus(postId, "DRAFT"))}>Unpublish</Button>
        )}
        {status === "PUBLISHED" ? (
          <Button size="sm" variant="outline" disabled={busy} onClick={() => run(() => setPostStatus(postId, "ARCHIVED"))}>Archive</Button>
        ) : null}
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive hover:text-destructive"
          disabled={busy}
          onClick={() => confirm("Delete this post permanently?") && run(() => deletePost(postId), () => router.push("/admin/content"))}
        >
          Delete
        </Button>
      </div>
      {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
    </div>
  );
}
