"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BellOff, Bell, Archive, ArchiveRestore, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Composer, type Attachment } from "./composer";
import { sendMessageAction, setMutedAction, setArchivedAction } from "./actions";

type Msg = {
  id: string;
  body: string;
  mine: boolean;
  senderName: string;
  attachmentUrl: string | null;
  attachmentName: string | null;
  attachmentType: string | null;
  createdAt: string;
};

function time(iso: string) {
  return new Date(iso).toLocaleString(undefined, { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" });
}

function Bubble({ m }: { m: Msg }) {
  const isImg = m.attachmentType?.startsWith("image/");
  return (
    <div className={cn("flex", m.mine ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[78%] rounded-2xl px-3.5 py-2 text-sm", m.mine ? "bg-primary text-primary-foreground" : "bg-muted")}>
        {m.attachmentUrl ? (
          isImg ? (
            <a href={m.attachmentUrl} target="_blank" rel="noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.attachmentUrl} alt={m.attachmentName ?? ""} className="mb-1 max-h-64 rounded-lg" />
            </a>
          ) : (
            <a
              href={m.attachmentUrl}
              target="_blank"
              rel="noreferrer"
              className={cn("mb-1 flex items-center gap-2 rounded-lg px-2 py-1.5", m.mine ? "bg-white/15" : "bg-background")}
            >
              <FileText className="size-4 shrink-0" />
              <span className="truncate underline">{m.attachmentName ?? "Attachment"}</span>
            </a>
          )
        ) : null}
        {m.body ? <p className="whitespace-pre-wrap">{m.body}</p> : null}
        <p className={cn("mt-1 text-[10px]", m.mine ? "text-primary-foreground/60" : "text-muted-foreground")}>{time(m.createdAt)}</p>
      </div>
    </div>
  );
}

export function ConversationView({
  conversationId,
  otherName,
  initialMessages,
  muted,
  archived,
}: {
  conversationId: string;
  otherName: string;
  initialMessages: Msg[];
  muted: boolean;
  archived: boolean;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const endRef = useRef<HTMLDivElement>(null);
  const lastAt = messages[messages.length - 1]?.createdAt ?? new Date(0).toISOString();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages.length]);

  useEffect(() => {
    const t = setInterval(async () => {
      try {
        const res = await fetch(`/api/messages/${conversationId}?since=${encodeURIComponent(lastAt)}`);
        if (!res.ok) return;
        const json = await res.json();
        if (json.messages?.length) {
          setMessages((prev) => {
            const ids = new Set(prev.map((m) => m.id));
            return [...prev, ...json.messages.filter((m: Msg) => !ids.has(m.id))];
          });
        }
      } catch {
        /* ignore */
      }
    }, 8000);
    return () => clearInterval(t);
  }, [conversationId, lastAt]);

  async function send(body: string, attachment?: Attachment) {
    const res = await sendMessageAction({ conversationId, body, attachment });
    if (res.ok) {
      const r = await fetch(`/api/messages/${conversationId}?since=${encodeURIComponent(lastAt)}`);
      const json = await r.json().catch(() => ({ messages: [] }));
      if (json.messages?.length) {
        setMessages((prev) => {
          const ids = new Set(prev.map((m) => m.id));
          return [...prev, ...json.messages.filter((m: Msg) => !ids.has(m.id))];
        });
      }
      router.refresh();
    }
    return res;
  }

  async function toggle(fn: () => Promise<{ ok: boolean }>) {
    await fn();
    router.refresh();
  }

  return (
    <div className="flex h-[calc(100vh-11rem)] flex-col rounded-lg border bg-card">
      <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <p className="font-display font-semibold">{otherName}</p>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => toggle(() => setMutedAction(conversationId, !muted))}>
            {muted ? <Bell className="size-4" /> : <BellOff className="size-4" />}
            <span className="ml-1 hidden sm:inline">{muted ? "Unmute" : "Mute"}</span>
          </Button>
          <Button size="sm" variant="ghost" onClick={() => toggle(() => setArchivedAction(conversationId, !archived))}>
            {archived ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />}
            <span className="ml-1 hidden sm:inline">{archived ? "Unarchive" : "Archive"}</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No messages yet. Say hello.</p>
        ) : (
          messages.map((m) => <Bubble key={m.id} m={m} />)
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t p-3">
        <Composer onSend={send} autoFocus />
      </div>
    </div>
  );
}
