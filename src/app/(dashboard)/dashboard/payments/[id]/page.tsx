import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PrintButton } from "./print-button";

export const metadata = { title: "Receipt" };

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const transaction = await db.transaction.findFirst({ where: { id, userId: user.id } });
  if (!transaction) notFound();

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/payments"><ArrowLeft className="size-4" /> Back</Link>
        </Button>
        <PrintButton />
      </div>

      <Card>
        <CardContent className="p-8">
          <h1 className="font-display text-xl font-semibold">Receipt</h1>
          <p className="text-sm text-muted-foreground">Career Forge</p>

          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between border-b pb-2">
              <dt className="text-muted-foreground">Reference</dt>
              <dd className="font-medium">{transaction.reference}</dd>
            </div>
            <div className="flex justify-between border-b pb-2">
              <dt className="text-muted-foreground">Description</dt>
              <dd className="font-medium">{transaction.description ?? transaction.productType}</dd>
            </div>
            <div className="flex justify-between border-b pb-2">
              <dt className="text-muted-foreground">Amount</dt>
              <dd className="font-medium">{formatCurrency(transaction.amountCents, transaction.currency)}</dd>
            </div>
            <div className="flex justify-between border-b pb-2">
              <dt className="text-muted-foreground">Date paid</dt>
              <dd className="font-medium">{transaction.paidAt ? formatDate(transaction.paidAt) : "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Payment provider</dt>
              <dd className="font-medium capitalize">{transaction.provider}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
