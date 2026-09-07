import Link from "next/link";
import { Package } from "lucide-react";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { getInstructorProfile, canSellMarketplace } from "@/lib/instructor/service";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

export const metadata = { title: "Digital products" };

const BADGE: Record<string, { label: string; variant: "secondary" | "warning" | "success" | "destructive" }> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  SUBMITTED: { label: "In review", variant: "warning" },
  CHANGES_REQUESTED: { label: "Changes requested", variant: "destructive" },
  APPROVED: { label: "Approved", variant: "success" },
};

export default async function InstructorProductsPage() {
  const user = await requireUser();
  const profile = await getInstructorProfile(user.id);
  if (!canSellMarketplace(user.permissions, profile?.status).allowed) {
    return (
      <div>
        <PageHeader title="Digital products" description="Sell ebooks, templates and downloadable resources." />
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            You need an approved instructor account first.{" "}
            <Link href="/instructor" className="text-primary hover:underline">Apply to teach</Link>.
          </CardContent>
        </Card>
      </div>
    );
  }

  const products = await db.digitalProduct.findMany({
    where: { sellerId: user.id },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { purchases: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Digital products"
        description="Sell ebooks, templates and downloadable resources. Every product is reviewed before it goes live."
        action={<Button asChild><Link href="/instructor/products/new">New product</Link></Button>}
      />

      <Card>
        <CardHeader><CardTitle>My products</CardTitle></CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nothing yet. <Link href="/instructor/products/new" className="text-primary hover:underline">Create your first product.</Link>
            </p>
          ) : (
            <ul className="divide-y">
              {products.map((p) => {
                const badge = BADGE[p.reviewStatus];
                return (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Package className="size-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <Link href={`/instructor/products/${p.id}`} className="font-medium hover:underline">{p.title}</Link>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(p.priceCents, p.currency)} · {p._count.purchases} sold · {p.status === "PUBLISHED" ? "Live" : "Not live"}
                        </p>
                      </div>
                    </div>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
