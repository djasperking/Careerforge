"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { startSubscriptionCheckout } from "./actions";

export function UpgradePlanControl({ planId }: { planId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpgrade() {
    setLoading(true);
    setError(null);
    const res = await startSubscriptionCheckout(planId);
    setLoading(false);
    if (!res.ok) setError(res.error);
    else window.location.href = res.data.authorizationUrl;
  }

  return (
    <div>
      <Button size="sm" onClick={handleUpgrade} disabled={loading} className="w-full">
        {loading ? <Loader2 className="size-4 animate-spin" /> : null}
        Upgrade
      </Button>
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
