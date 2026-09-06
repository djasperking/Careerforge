"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { startDigitalProductCheckout } from "@/app/(dashboard)/dashboard/payments/actions";

export function BuyProductButton({
  productId,
  isLoggedIn,
  owned,
  slug,
}: {
  productId: string;
  isLoggedIn: boolean;
  owned: boolean;
  slug: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (owned) {
    return (
      <Button asChild size="lg">
        <a href={`/api/products/${productId}/download`}>Download</a>
      </Button>
    );
  }

  if (!isLoggedIn) {
    return (
      <Button asChild size="lg">
        <Link href={`/login?next=/products/${slug}`}>Log in to buy</Link>
      </Button>
    );
  }

  async function buy() {
    setLoading(true);
    setError(null);
    const res = await startDigitalProductCheckout(productId);
    setLoading(false);
    if (!res.ok) setError(res.error);
    else window.location.href = res.data.authorizationUrl;
  }

  return (
    <div>
      <Button size="lg" onClick={buy} disabled={loading}>
        {loading ? <Loader2 className="size-4 animate-spin" /> : null}
        Buy now
      </Button>
      {error ? (
        <Alert variant="destructive" className="mt-3 max-w-md">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
