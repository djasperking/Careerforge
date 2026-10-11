"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, CheckCircle2, Loader2, MessageCircle, Send, Sparkles, Ticket, X } from "lucide-react";
import { createSupportTicket } from "@/app/(dashboard)/dashboard/support/actions";
import { deriveTicketMessage, deriveTicketSubject, type ChatMessage } from "@/lib/support/chat";
import { cn } from "@/lib/utils";

type Msg = ChatMessage & { suggestTicket?: boolean };

const STORAGE_KEY = "cf-support-chat-v1";

const SUGGESTIONS = [
  "How do I remove the watermark from my CV?",
  "I paid but didn't get access",
  "How do refunds work?",
  "How do referral credits work?",
];

const CATEGORIES: { value: string; label: string }[] = [
  { value: "PAYMENT", label: "Payment or refund" },
  { value: "COURSE", label: "Course or exam" },
  { value: "ACCOUNT", label: "My account" },
  { value: "CV", label: "CV builder" },
  { value: "TECHNICAL", label: "Something isn't working" },
  { value: "OTHER", label: "Something else" },
];

// Only link paths that really exist on the site.
const PATH_RE =
  /(\/(?:register|login|forgot-password|courses|jobs|coaching|products|dashboard(?:\/[a-z-]+)*|legal\/(?:refund|terms|privacy))\b)/g;

function renderText(text: string) {
  const clean = text.replace(/\*\*/g, "");
  return clean.split(PATH_RE).map((part, i) =>
    i % 2 === 1 ? (
      <Link key={i} href={part} className="font-medium text-primary underline underline-offset-2">
        {part}
      </Link>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

/** Pages where an AI helper must not appear (e.g. while taking an exam). */
function hiddenOn(pathname: string) {
  return pathname.startsWith("/admin") || /^\/dashboard\/exams\/[^/]+\/attempts\//.test(pathname);
}

export function SupportWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"chat" | "ticket" | "done">("chat");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [category, setCategory] = useState("OTHER");
  const [subject, setSubject] = useState("");
  const [details, setDetails] = useState("");
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const scroller = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Restore the conversation for this browser session.
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) setMessages(JSON.parse(saved));
    } catch {
      /* storage unavailable — start fresh */
    }
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-20)));
    } catch {
      /* ignore */
    }
  }, [messages]);

  // Find out once whether the visitor is logged in (tickets need an account).
  useEffect(() => {
    if (!open || loggedIn !== null) return;
    fetch("/api/support/chat")
      .then((r) => r.json())
      .then((d) => setLoggedIn(Boolean(d.loggedIn)))
      .catch(() => setLoggedIn(false));
  }, [open, loggedIn]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy, view, open]);

  useEffect(() => {
    if (open && view === "chat") inputRef.current?.focus();
  }, [open, view]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || busy) return;
      setError(null);
      const next: Msg[] = [...messages, { role: "user", content }];
      setMessages(next);
      setInput("");
      setBusy(true);
      try {
        const res = await fetch("/api/support/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: next.map(({ role, content }) => ({ role, content })) }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) throw new Error(data.error || "Something went wrong.");
        if (typeof data.loggedIn === "boolean") setLoggedIn(data.loggedIn);
        if (data.category) setCategory(data.category);
        setMessages([...next, { role: "assistant", content: data.reply, suggestTicket: Boolean(data.suggestTicket) }]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't reach support. Try again.");
      } finally {
        setBusy(false);
      }
    },
    [messages, busy],
  );

  function openTicket() {
    setSubject(deriveTicketSubject(messages));
    setDetails(deriveTicketMessage(messages));
    setError(null);
    setView("ticket");
  }

  async function submitTicket(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    const res = await createSupportTicket({ category, subject, message: details });
    setSending(false);
    if (!res.ok) return setError(res.error);
    setTicketId(res.data.id);
    setView("done");
  }

  function reset() {
    setMessages([]);
    setView("chat");
    setTicketId(null);
    setError(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  if (hiddenOn(pathname)) return null;

  return (
    <>
      {open ? (
        <div
          role="dialog"
          aria-label="Chat with support"
          className="fixed bottom-24 right-4 z-50 flex h-[min(34rem,calc(100dvh-8rem))] w-[min(23.5rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl sm:right-6"
        >
          <header className="flex items-center gap-3 border-b bg-primary px-4 py-3 text-primary-foreground">
            {view !== "chat" ? (
              <button type="button" onClick={() => setView("chat")} aria-label="Back to chat" className="rounded-md p-1 hover:bg-white/15">
                <ArrowLeft className="size-4" />
              </button>
            ) : (
              <span className="grid size-8 place-items-center rounded-full bg-white/15">
                <Sparkles className="size-4" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight">
                {view === "chat" ? "Career Forge Support" : view === "ticket" ? "Create a support ticket" : "Ticket created"}
              </p>
              <p className="text-xs opacity-80">{view === "chat" ? "AI assistant · replies instantly" : "A person will reply by email and in your dashboard"}</p>
            </div>
            {view === "chat" ? (
              <button
                type="button"
                onClick={openTicket}
                className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2 py-1 text-xs font-medium hover:bg-white/25"
              >
                <Ticket className="size-3.5" /> Ticket
              </button>
            ) : null}
            <button type="button" onClick={() => setOpen(false)} aria-label="Close chat" className="rounded-md p-1 hover:bg-white/15">
              <X className="size-4" />
            </button>
          </header>

          {view === "chat" ? (
            <>
              <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {messages.length === 0 ? (
                  <div className="space-y-3">
                    <div className="rounded-xl rounded-tl-sm bg-muted px-3 py-2 text-sm">
                      Hi! 👋 I can answer questions about Career Forge — CVs, courses, payments, refunds and more. What do you need help with?
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {SUGGESTIONS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => send(s)}
                          className="rounded-full border bg-background px-3 py-1.5 text-left text-xs hover:border-primary hover:text-primary"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((m, i) => (
                    <div key={i} className={cn("flex flex-col gap-2", m.role === "user" ? "items-end" : "items-start")}>
                      <div
                        className={cn(
                          "max-w-[85%] whitespace-pre-wrap break-words rounded-xl px-3 py-2 text-sm",
                          m.role === "user" ? "rounded-tr-sm bg-primary text-primary-foreground" : "rounded-tl-sm bg-muted",
                        )}
                      >
                        {m.role === "assistant" ? renderText(m.content) : m.content}
                      </div>
                      {m.role === "assistant" && m.suggestTicket ? (
                        <button
                          type="button"
                          onClick={openTicket}
                          className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10"
                        >
                          <Ticket className="size-3.5" /> Need a person? Create a support ticket
                        </button>
                      ) : null}
                    </div>
                  ))
                )}
                {busy ? (
                  <div className="flex items-center gap-1.5 rounded-xl rounded-tl-sm bg-muted px-3 py-2.5 text-muted-foreground" aria-label="Assistant is typing">
                    <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-current" />
                  </div>
                ) : null}
                {error ? <p className="text-center text-xs text-destructive">{error}</p> : null}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send(input);
                }}
                className="border-t p-3"
              >
                <div className="flex items-end gap-2">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send(input);
                      }
                    }}
                    rows={1}
                    maxLength={800}
                    placeholder="Type your question…"
                    aria-label="Your message"
                    className="max-h-28 min-h-10 flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  />
                  <button
                    type="submit"
                    disabled={busy || !input.trim()}
                    aria-label="Send message"
                    className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground transition-opacity hover:bg-primary/90 disabled:opacity-40"
                  >
                    {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  </button>
                </div>
                <p className="mt-2 text-center text-[11px] text-muted-foreground">
                  AI assistant — it can make mistakes. For account or payment issues,{" "}
                  <button type="button" onClick={openTicket} className="underline underline-offset-2 hover:text-foreground">
                    create a ticket
                  </button>
                  .
                  {messages.length > 0 ? (
                    <>
                      {" "}
                      <button type="button" onClick={reset} className="underline underline-offset-2 hover:text-foreground">
                        Clear chat
                      </button>
                    </>
                  ) : null}
                </p>
              </form>
            </>
          ) : null}

          {view === "ticket" ? (
            loggedIn === false ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
                <Ticket className="size-8 text-primary" />
                <p className="font-medium">Log in to create a ticket</p>
                <p className="text-sm text-muted-foreground">
                  Tickets are tied to your account so we can find your orders and reply to you.
                </p>
                <div className="flex gap-2">
                  <Link href="/login?next=/dashboard/support/new" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                    Log in
                  </Link>
                  <Link href="/register" className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">
                    Create account
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={submitTicket} className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
                <label className="space-y-1 text-sm font-medium">
                  What is it about?
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1 h-10 w-full rounded-md border border-input bg-background px-2 text-sm font-normal"
                  >
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </label>
                <label className="space-y-1 text-sm font-medium">
                  Subject
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    minLength={3}
                    maxLength={200}
                    className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-normal"
                  />
                </label>
                <label className="flex-1 space-y-1 text-sm font-medium">
                  Tell us what happened
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    required
                    minLength={5}
                    rows={5}
                    placeholder="Include any payment reference or course name that helps."
                    className="mt-1 min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-normal"
                  />
                </label>
                {error ? <p className="text-xs text-destructive">{error}</p> : null}
                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  {sending ? <Loader2 className="size-4 animate-spin" /> : <Ticket className="size-4" />} Submit ticket
                </button>
              </form>
            )
          ) : null}

          {view === "done" ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
              <CheckCircle2 className="size-10 text-success" />
              <p className="font-medium">We&apos;ve got your ticket</p>
              <p className="text-sm text-muted-foreground">A member of the team will reply. You can follow it, and add details, in your dashboard.</p>
              <Link
                href={ticketId ? `/dashboard/support/${ticketId}` : "/dashboard/support"}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                View my ticket
              </Link>
              <button type="button" onClick={reset} className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground">
                Start a new chat
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close support chat" : "Chat with support"}
        aria-expanded={open}
        className="fixed bottom-5 right-4 z-50 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-primary/20 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-primary/50 sm:right-6"
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
      </button>
    </>
  );
}
