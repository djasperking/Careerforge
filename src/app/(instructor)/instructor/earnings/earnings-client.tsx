"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { savePayoutMethodAction, requestPayoutAction } from "./actions";

export function PayoutMethodForm({
  initial,
}: {
  initial: { bankName: string; accountNumber: string; accountName: string };
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await savePayoutMethodAction(form);
    setBusy(false);
    setMsg(res.ok ? { ok: true, text: "Saved." } : { ok: false, text: res.error });
    if (res.ok) router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="bankName">Bank name</Label>
          <Input id="bankName" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="accountNumber">Account number</Label>
          <Input id="accountNumber" inputMode="numeric" value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="accountName">Account name</Label>
          <Input id="accountName" value={form.accountName} onChange={(e) => setForm({ ...form, accountName: e.target.value })} required />
        </div>
      </div>
      {msg ? (
        <Alert variant={msg.ok ? "success" : "destructive"}><AlertDescription>{msg.text}</AlertDescription></Alert>
      ) : null}
      <Button type="submit" size="sm" disabled={busy}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : null} Save bank details
      </Button>
    </form>
  );
}

export function RequestPayoutButton({ disabled, hint }: { disabled: boolean; hint: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    const res = await requestPayoutAction(note || undefined);
    setBusy(false);
    if (res.ok) router.refresh();
    else setError(res.error);
  }

  return (
    <div className="space-y-2">
      <Input placeholder="Note for the finance team (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
      <Button onClick={submit} disabled={disabled || busy}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : null} Request payout
      </Button>
      {disabled ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
    </div>
  );
}
