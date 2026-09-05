"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { replyToTicket } from "../actions";

export function ReplyForm({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    if (!body.trim()) return;
    setLoading(true);
    setError(null);
    const res = await replyToTicket(ticketId, body);
    setLoading(false);
    if (!res.ok) setError(res.error);
    else {
      setBody("");
      router.refresh();
    }
  }

  return (
    <div className="mt-4 space-y-2">
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder="Write a reply…"
        className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
      />
      <Button size="sm" onClick={handleSend} disabled={loading}>
        {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        Send
      </Button>
    </div>
  );
}
