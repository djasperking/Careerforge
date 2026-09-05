import Link from "next/link";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { finalizeTransaction } from "@/lib/billing/service";
import { Brand } from "@/components/layout/brand";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

export const metadata = { title: "Payment result" };

export default async function PaymentCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string }>;
}) {
  const user = await requireUser();
  const { reference } = await searchParams;

  let error: string | null = null;
  if (reference) {
    const owned = await db.transaction.findFirst({ where: { reference, userId: user.id } });
    if (!owned) {
      error = "This payment reference does not belong to your account.";
    } else {
      try {
        await finalizeTransaction(reference);
      } catch (err) {
        error = (err as Error).message;
      }
    }
  } else {
    error = "Missing payment reference.";
  }

  const transaction = reference ? await db.transaction.findUnique({ where: { reference } }) : null;
  const success = transaction?.status === "SUCCESS";
  const pending = transaction?.status === "PENDING";

  return (
    <div className="grid min-h-screen place-items-center p-6">
      <div className="w-full max-w-md">
        <Brand />
        <Card className="mt-8">
          <CardContent className="p-8 text-center">
            {success ? (
              <>
                <CheckCircle2 className="mx-auto size-12 text-success" />
                <h1 className="mt-3 font-display text-xl font-semibold">Payment successful</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {transaction?.description} — {formatCurrency(transaction!.amountCents, transaction!.currency)}
                </p>
              </>
            ) : pending ? (
              <>
                <Clock className="mx-auto size-12 text-warning" />
                <h1 className="mt-3 font-display text-xl font-semibold">Payment pending</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  We haven&apos;t confirmed this payment yet. Check back shortly.
                </p>
              </>
            ) : (
              <>
                <XCircle className="mx-auto size-12 text-destructive" />
                <h1 className="mt-3 font-display text-xl font-semibold">Payment not completed</h1>
                <p className="mt-2 text-sm text-muted-foreground">{error ?? "This payment could not be verified."}</p>
              </>
            )}
            <Button asChild className="mt-6">
              <Link href="/dashboard/payments">Go to payments</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
