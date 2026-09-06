import Link from "next/link";
import { Download, CalendarClock } from "lucide-react";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "My purchases" };

const BOOKING_LABEL: Record<string, string> = {
  PENDING_PAYMENT: "Awaiting payment",
  REQUESTED: "Awaiting coach confirmation",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export default async function PurchasesPage() {
  const user = await requireUser();
  const [products, bookings] = await Promise.all([
    db.digitalProductPurchase.findMany({
      where: { userId: user.id },
      include: { product: { include: { seller: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.coachingBooking.findMany({
      where: { userId: user.id, status: { not: "PENDING_PAYMENT" } },
      include: { offer: { include: { coach: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div>
      <PageHeader title="My purchases" description="Your digital products and coaching sessions." />

      <div className="mb-6 flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm"><Link href="/products">Browse digital products</Link></Button>
        <Button asChild variant="outline" size="sm"><Link href="/coaching">Browse coaching</Link></Button>
        <Button asChild variant="outline" size="sm"><Link href="/courses">Browse courses</Link></Button>
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle>Digital products</CardTitle></CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <EmptyState title="No products yet" description="Browse the store to find ebooks and templates." />
          ) : (
            <ul className="divide-y">
              {products.map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="font-medium">{row.product.title}</p>
                    <p className="text-xs text-muted-foreground">
                      By {row.product.seller?.name ?? "Career Forge"} · bought {formatDate(row.createdAt)}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <a href={`/api/products/${row.productId}/download`}>
                      <Download className="size-4" /> Download
                    </a>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Coaching sessions</CardTitle></CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <EmptyState title="No sessions booked" description="Find a coach in the coaching directory." />
          ) : (
            <ul className="divide-y">
              {bookings.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="font-medium">{b.offer.title}</p>
                    <p className="text-xs text-muted-foreground">
                      With {b.offer.coach?.name ?? "Coach"} ·{" "}
                      {b.scheduledAt ? formatDate(b.scheduledAt, { hour: "2-digit", minute: "2-digit" }) : "time TBC"}
                    </p>
                    {b.meetingUrl ? (
                      <a href={b.meetingUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                        Join link
                      </a>
                    ) : null}
                  </div>
                  <Badge variant={b.status === "CONFIRMED" || b.status === "COMPLETED" ? "success" : "secondary"}>
                    <CalendarClock className="mr-1 size-3" />
                    {BOOKING_LABEL[b.status]}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <p className="mt-6 text-sm text-muted-foreground">
        Browse <Link href="/products" className="text-primary hover:underline">digital products</Link> or{" "}
        <Link href="/coaching" className="text-primary hover:underline">coaching</Link>.
      </p>
    </div>
  );
}
