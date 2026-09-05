"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { replyToTicketAsAdmin } from "../actions";

export function AdminReplyForm({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    if (!body.trim()) return;
    setLoading(true);
    setError(null);
    const res = await replyToTicketAsAdmin({ ticketId, body, isInternalNote });
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
        placeholder={isInternalNote ? "Internal note (not visible to the customer)…" : "Reply to the customer…"}
        className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
      />
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={isInternalNote} onChange={(e) => setIsInternalNote(e.target.checked)} className="size-3.5" />
          Internal note only
        </label>
        <Button size="sm" onClick={handleSend} disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          {isInternalNote ? "Add note" : "Send reply"}
        </Button>
      </div>
    </div>
  );
}
