import Link from "next/link";
import { Brand } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { env } from "@/lib/env";
import { notFound } from "next/navigation";

export const metadata = { title: "Mock checkout" };

/**
 * Local-only stand-in for the Paystack hosted page. Only reachable when
 * PAYMENT_PROVIDER=mock. It does not move money — it just returns to the
 * callback URL so the Phase 6 verification flow can be exercised end-to-end.
 */
export default async function MockCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; redirect?: string }>;
}) {
  if (env.PAYMENT_PROVIDER !== "mock") notFound();
  const { reference, redirect } = await searchParams;
  const back = redirect
    ? `${redirect}${redirect.includes("?") ? "&" : "?"}reference=${encodeURIComponent(reference ?? "")}`
    : "/dashboard/payments";

  return (
    <div className="grid min-h-screen place-items-center p-6">
      <div className="w-full max-w-md">
        <Brand />
        <Card className="mt-8">
          <CardContent className="p-6">
            <Alert variant="warning">
              <AlertDescription>
                Development mock checkout — no real payment is processed.
              </AlertDescription>
            </Alert>
            <p className="mt-4 text-sm text-muted-foreground">
              Reference: <code>{reference ?? "—"}</code>
            </p>
            <div className="mt-6 flex gap-2">
              <Button asChild className="flex-1">
                <Link href={back}>Simulate success</Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href="/dashboard/payments">Cancel</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
