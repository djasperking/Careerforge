"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { revokeClaimAction } from "./actions";

export function RevokeClaimButton({ claimId }: { claimId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function revoke() {
    if (!confirm("Revoke this claim and claw back the credit? This can't be undone.")) return;
    setBusy(true);
    setError(null);
    const res = await revokeClaimAction(claimId);
    setBusy(false);
    if (!res.ok) setError(res.error);
    else router.refresh();
  }

  return (
    <div className="text-right">
      <Button size="sm" variant="outline" onClick={revoke} disabled={busy}>
        {busy ? <Loader2 className="size-3.5 animate-spin" /> : null} Revoke
      </Button>
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
