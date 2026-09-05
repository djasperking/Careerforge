"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ResendVerification() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function resend() {
    setState("sending");
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" });
      setState(res.ok ? "sent" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "sent") {
    return <span className="text-sm">Verification email sent — check your inbox (and spam folder).</span>;
  }

  return (
    <span className="flex flex-wrap items-center gap-2 text-sm">
      Your email isn&apos;t verified yet.
      <Button size="sm" variant="outline" onClick={resend} disabled={state === "sending"}>
        {state === "sending" ? "Sending…" : "Resend verification email"}
      </Button>
      {state === "error" ? <span className="text-destructive">Couldn&apos;t send just now — try again shortly.</span> : null}
    </span>
  );
}
