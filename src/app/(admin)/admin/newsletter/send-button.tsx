"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { sendDigestNow, sendJobAlertsNow } from "./actions";

export function SendJobAlertsButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function go() {
    if (!confirm("Send 'jobs that match your CV' emails now? Goes to opted-in users with a CV and at least one match.")) return;
    setBusy(true);
    setMsg(null);
    const res = await sendJobAlertsNow();
    setBusy(false);
    if (res.ok) {
      setMsg({
        ok: true,
        text: res.skipped
          ? `Not sent: ${res.skipped}.`
          : `Scanned ${res.scanned} job-seeker${res.scanned === 1 ? "" : "s"}, emailed ${res.sent}.`,
      });
      router.refresh();
    } else {
      setMsg({ ok: false, text: res.error });
    }
  }

  return (
    <div className="space-y-2">
      <Button variant="outline" onClick={go} disabled={busy}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : null} Send job-match alerts now
      </Button>
      {msg ? <Alert variant={msg.ok ? "success" : "destructive"}><AlertDescription>{msg.text}</AlertDescription></Alert> : null}
    </div>
  );
}

export function SendDigestButton({ subscribers }: { subscribers: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function go() {
    if (!confirm(`Send this week's digest to ${subscribers} subscriber${subscribers === 1 ? "" : "s"} now?`)) return;
    setBusy(true);
    setMsg(null);
    const res = await sendDigestNow();
    setBusy(false);
    if (res.ok) {
      setMsg({ ok: true, text: res.skipped ? `Not sent: ${res.skipped}.` : `Sent to ${res.sent} subscriber${res.sent === 1 ? "" : "s"}.` });
      router.refresh();
    } else {
      setMsg({ ok: false, text: res.error });
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={go} disabled={busy || subscribers === 0}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : null} Send digest now
      </Button>
      {msg ? <Alert variant={msg.ok ? "success" : "destructive"}><AlertDescription>{msg.text}</AlertDescription></Alert> : null}
    </div>
  );
}
