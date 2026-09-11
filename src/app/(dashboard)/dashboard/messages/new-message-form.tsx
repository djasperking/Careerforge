"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Composer, type Attachment } from "./composer";
import { searchMessageableAction, startConversationAction } from "./actions";

type Person = { id: string; name: string; email: string };

export function NewMessageForm({ basePath = "/dashboard/messages" }: { basePath?: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Person[]>([]);
  const [searching, setSearching] = useState(false);
  const [to, setTo] = useState<Person | null>(null);

  useEffect(() => {
    if (to || q.trim().length < 2) {
      setResults([]);
      return;
    }
    const h = setTimeout(async () => {
      setSearching(true);
      const res = await searchMessageableAction(q);
      setSearching(false);
      if (res.ok) setResults(res.data);
    }, 300);
    return () => clearTimeout(h);
  }, [q, to]);

  async function send(body: string, attachment?: Attachment) {
    if (!to) return { ok: false, error: "Pick someone to message." };
    const res = await startConversationAction({ toUserId: to.id, body, attachment });
    if (res.ok) router.push(`${basePath}/${res.data.conversationId}`);
    return res;
  }

  return (
    <div className="space-y-4 rounded-lg border bg-card p-5">
      {to ? (
        <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 text-sm">
          <span>To: <span className="font-medium">{to.name}</span></span>
          <button onClick={() => { setTo(null); setQ(""); }} className="text-muted-foreground hover:text-foreground">Change</button>
        </div>
      ) : (
        <div className="relative">
          <Input
            placeholder="Search for an instructor or the Career Forge team"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {searching ? <Loader2 className="absolute right-3 top-2.5 size-4 animate-spin text-muted-foreground" /> : null}
          {results.length > 0 ? (
            <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border bg-card shadow-lg">
              {results.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => { setTo(p); setResults([]); }}
                    className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-muted"
                  >
                    <span className="font-medium">{p.name}</span>
                    <span className="text-xs text-muted-foreground">{p.email}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : q.trim().length >= 2 && !searching ? (
            <p className="mt-2 text-xs text-muted-foreground">No one found. You can message instructors and the Career Forge team.</p>
          ) : null}
        </div>
      )}

      <Composer onSend={send} placeholder={to ? `Message ${to.name}…` : "Pick someone first…"} />
    </div>
  );
}
