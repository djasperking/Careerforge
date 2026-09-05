"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { askCareerAssistant, type ChatMessage } from "./actions";

export function AiChat({ mode }: { mode: "career.assistant" | "interview.coach" }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    const question = input.trim();
    if (!question) return;
    setInput("");
    setError(null);
    const nextHistory = [...messages, { role: "user" as const, content: question }];
    setMessages(nextHistory);
    setLoading(true);
    const res = await askCareerAssistant({ mode, history: messages, question });
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setMessages([...nextHistory, { role: "assistant", content: res.data.reply }]);
  }

  return (
    <div>
      <div className="mb-3 flex min-h-[220px] max-h-[420px] flex-col gap-3 overflow-y-auto rounded-md border bg-muted/30 p-4">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {mode === "interview.coach"
              ? "Ask about interview questions for a role, or paste one to practise answering it."
              : "Ask about career planning, skill gaps, transitions, or anything career-related."}
          </p>
        ) : null}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "self-end" : "self-start"}>
            <div className={m.role === "user" ? "rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground" : "rounded-lg bg-card border px-3 py-2 text-sm"}>
              {m.content}
            </div>
            {m.role === "assistant" ? <Badge variant="secondary" className="mt-1">AI-generated — review before acting on it</Badge> : null}
          </div>
        ))}
        {loading ? <Loader2 className="size-4 animate-spin self-start text-muted-foreground" /> : null}
      </div>
      {error ? <p className="mb-2 text-xs text-destructive">{error}</p> : null}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Type a message…"
          className="flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button onClick={send} disabled={loading}>
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}
