import Link from "next/link";
import { CheckCircle2, XCircle, Clock, Download } from "lucide-react";
import { db } from "@/lib/db";
import { finalizeTransaction } from "@/lib/billing/service";
import { Brand } from "@/components/layout/brand";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

export const metadata = { title: "Payment result" };

export default async function CheckoutCompletePage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string }>;
}) {
  const { reference } = await searchParams;

  let error: string | null = reference ? null : "Missing payment reference.";
  if (reference) {
    try {
      await finalizeTransaction(reference);
    } catch (err) {
      error = (err as Error).message;
    }
  }

  const transaction = reference ? await db.transaction.findUnique({ where: { reference } }) : null;
  const success = transaction?.status === "SUCCESS";
  const pending = transaction?.status === "PENDING";

  let downloadUrl: string | null = null;
  let isVideo = false;
  if (success && transaction?.productType === "DIGITAL_PRODUCT" && transaction.productId) {
    const [purchase, product] = await Promise.all([
      db.digitalProductPurchase.findUnique({
        where: { productId_userId: { productId: transaction.productId, userId: transaction.userId } },
        select: { downloadToken: true },
      }),
      db.digitalProduct.findUnique({
        where: { id: transaction.productId },
        select: { slug: true, deliveryType: true },
      }),
    ]);
    isVideo = Boolean(product && product.deliveryType !== "FILE");
    if (purchase?.downloadToken) {
      downloadUrl =
        isVideo && product
          ? `/products/${product.slug}/watch?token=${purchase.downloadToken}`
          : `/api/products/${transaction.productId}/download?token=${purchase.downloadToken}`;
    }
  }

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
                <p className="mt-2 text-sm text-muted-foreground">
                  We&apos;ve emailed your {isVideo ? "access" : "download"} link to {transaction ? "your inbox" : "you"}. You can also
                  {isVideo ? " watch" : " download"} it right here:
                </p>
                {downloadUrl ? (
                  <Button asChild className="mt-6">
                    <a href={downloadUrl}>
                      <Download className="size-4" /> {isVideo ? "Watch now" : "Download now"}
                    </a>
                  </Button>
                ) : (
                  <p className="mt-6 text-sm text-muted-foreground">
                    Your {isVideo ? "access" : "download"} link is on its way by email.
                  </p>
                )}
                <p className="mt-4 text-xs text-muted-foreground">
                  We created an account for your email so you can access purchases any time.{" "}
                  <Link href="/forgot-password" className="text-primary hover:underline">Set a password</Link>.
                </p>
              </>
            ) : pending ? (
              <>
                <Clock className="mx-auto size-12 text-warning" />
                <h1 className="mt-3 font-display text-xl font-semibold">Payment pending</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  We haven&apos;t confirmed this payment yet. We&apos;ll email your download link as soon as it clears.
                </p>
              </>
            ) : (
              <>
                <XCircle className="mx-auto size-12 text-destructive" />
                <h1 className="mt-3 font-display text-xl font-semibold">Payment not completed</h1>
                <p className="mt-2 text-sm text-muted-foreground">{error ?? "This payment could not be verified."}</p>
              </>
            )}
            <div className="mt-6">
              <Link href="/products" className="text-sm text-primary hover:underline">Browse more products</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
