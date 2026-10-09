"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { clearCrawlerJobs } from "../clips/actions";

export function ClearCrawlerButton({ total, live }: { total: number; live: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function clear() {
    const warning =
      live > 0
        ? `Remove all ${total} crawler jobs? ${live} of them are LIVE on your public jobs page and will disappear from it. This can't be undone.`
        : `Remove all ${total} crawler jobs? This can't be undone.`;
    if (!confirm(warning)) return;
    setBusy(true);
    setMsg(null);
    const res = await clearCrawlerJobs();
    setBusy(false);
    if (!res.ok) return setMsg({ ok: false, text: res.error });
    setMsg({ ok: true, text: `Removed ${res.data.count} crawler jobs.` });
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <Button variant="destructive" onClick={clear} disabled={busy || total === 0}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />} Remove all {total} crawler jobs
      </Button>
      {msg ? <Alert variant={msg.ok ? "success" : "destructive"}><AlertDescription>{msg.text}</AlertDescription></Alert> : null}
    </div>
  );
}
