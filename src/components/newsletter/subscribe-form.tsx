"use client";

import { useState } from "react";
import { Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { subscribeAction } from "@/lib/newsletter/actions";

export function SubscribeForm({
  source,
  compact = false,
  onDark = false,
}: {
  source?: string;
  compact?: boolean;
  onDark?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    const res = await subscribeAction(email, source);
    if (res.ok) {
      setState("done");
      setMsg(res.already ? "You're already on the list." : "You're subscribed — see you weekly.");
    } else {
      setState("error");
      setMsg(res.error);
    }
  }

  if (state === "done") {
    return (
      <p className={cn("flex items-center gap-2 text-sm", onDark ? "text-white/80" : compact ? "text-xs text-muted-foreground" : "text-success")}>
        <Check className="size-4 shrink-0" /> {msg}
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-1.5">
      <div className="flex gap-2">
        <Input
          type="email"
          required
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={cn(compact && "h-9", onDark && "border-white/20 bg-white/10 text-white placeholder:text-white/50")}
        />
        <Button
          type="submit"
          size={compact ? "sm" : "default"}
          disabled={state === "loading"}
          className={onDark ? "bg-white text-primary hover:bg-white/90" : undefined}
        >
          {state === "loading" ? <Loader2 className="size-4 animate-spin" /> : "Subscribe"}
        </Button>
      </div>
      {state === "error" ? <p className={cn("text-xs", onDark ? "text-red-300" : "text-destructive")}>{msg}</p> : null}
    </form>
  );
}
