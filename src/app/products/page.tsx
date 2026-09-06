import Link from "next/link";
import { db } from "@/lib/db";
import { Brand } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils";
import { getCurrentUser } from "@/lib/session";
import { effectivePriceCents, discountIsActive } from "@/lib/instructor/service";

export const metadata = { title: "Digital products" };

export default async function PublicProductsPage() {
  const [products, user] = await Promise.all([
    db.digitalProduct.findMany({
      where: { status: "PUBLISHED", reviewStatus: "APPROVED" },
      include: { seller: true },
      orderBy: { publishedAt: "desc" },
      take: 60,
    }),
    getCurrentUser(),
  ]);

  return (
    <div className="min-h-screen">
      <header className="border-b bg-card">
        <div className="container flex h-16 items-center justify-between">
          <Brand />
          <Button asChild size="sm" variant={user ? "default" : "outline"}>
            <Link href={user ? "/dashboard" : "/login"}>{user ? "Dashboard" : "Log in"}</Link>
          </Button>
        </div>
      </header>

      <main className="container py-10">
        <h1 className="font-display text-3xl font-semibold">Digital products</h1>
        <p className="mt-1 text-muted-foreground">Ebooks, templates and resources from Career Forge instructors.</p>

        {products.length === 0 ? (
          <EmptyState title="No products yet" description="Check back soon." />
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => {
              const price = effectivePriceCents(p);
              return (
                <Link key={p.id} href={`/products/${p.slug}`}>
                  <Card className="h-full transition-colors hover:border-primary/40">
                    <CardContent className="p-5">
                      {p.coverImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.coverImageUrl} alt="" className="mb-3 h-32 w-full rounded-md border object-cover" />
                      ) : null}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {price === 0 ? "Free" : formatCurrency(price, p.currency)}
                        </span>
                        {discountIsActive(p) ? (
                          <span className="text-xs text-muted-foreground line-through">
                            {formatCurrency(p.priceCents, p.currency)}
                          </span>
                        ) : null}
                      </div>
                      <h2 className="mt-2 font-display text-lg font-semibold">{p.title}</h2>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
                      <p className="mt-3 text-xs text-muted-foreground">By {p.seller?.name ?? "Career Forge"}</p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
