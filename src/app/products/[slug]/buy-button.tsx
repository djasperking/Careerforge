"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  startDigitalProductCheckout,
  startGuestDigitalProductCheckout,
} from "@/app/(dashboard)/dashboard/payments/actions";

export function BuyProductButton({
  productId,
  isLoggedIn,
  owned,
  slug,
  deliveryType = "FILE",
}: {
  productId: string;
  isLoggedIn: boolean;
  owned: boolean;
  slug: string;
  deliveryType?: "FILE" | "EXTERNAL_VIDEO";
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  if (owned) {
    return (
      <Button asChild size="lg">
        {deliveryType === "EXTERNAL_VIDEO" ? (
          <a href={`/products/${slug}/watch`}>Watch now</a>
        ) : (
          <a href={`/api/products/${productId}/download`}>Download</a>
        )}
      </Button>
    );
  }

  async function buyAsUser() {
    setLoading(true);
    setError(null);
    const res = await startDigitalProductCheckout(productId);
    setLoading(false);
    if (!res.ok) setError(res.error);
    else window.location.href = res.data.authorizationUrl;
  }

  async function buyAsGuest(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await startGuestDigitalProductCheckout({ productId, name, email });
    setLoading(false);
    if (!res.ok) setError(res.error);
    else window.location.href = res.data.authorizationUrl;
  }

  if (isLoggedIn) {
    return (
      <div>
        <Button size="lg" onClick={buyAsUser} disabled={loading} className="w-full">
          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
          Buy now
        </Button>
        {error ? (
          <Alert variant="destructive" className="mt-3">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={buyAsGuest} className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="buyer-name">Your name</Label>
        <Input id="buyer-name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} autoComplete="name" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="buyer-email">Email</Label>
        <Input id="buyer-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        <p className="text-xs text-muted-foreground">Your download link is sent here. No account or password needed.</p>
      </div>
      <Button type="submit" size="lg" disabled={loading} className="w-full">
        {loading ? <Loader2 className="size-4 animate-spin" /> : null}
        Buy now
      </Button>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <p className="text-center text-xs text-muted-foreground">
        Have an account?{" "}
        <Link href={`/login?next=/products/${slug}`} className="text-primary hover:underline">Log in</Link>
      </p>
    </form>
  );
}
