import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { effectivePriceCents, discountIsActive } from "@/lib/instructor/service";
import { userOwnsDigitalProduct } from "@/lib/marketplace/digital";
import { appUrl } from "@/lib/email";
import { SharePanel } from "@/components/ui/share-panel";
import { BuyProductButton } from "./buy-button";

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, user] = await Promise.all([
    db.digitalProduct.findFirst({
      where: { slug, status: "PUBLISHED", reviewStatus: "APPROVED" },
      include: { seller: true },
    }),
    getCurrentUser(),
  ]);
  if (!product) notFound();

  const isSeller = user?.id === product.sellerId;
  const owned = user ? isSeller || (await userOwnsDigitalProduct(user.id, product.id)) : false;
  const price = effectivePriceCents(product);

  return (
    <div className="min-h-screen">
      <MarketingHeader loggedIn={Boolean(user)} />

      <main className="container grid gap-10 py-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {product.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.coverImageUrl} alt="" className="mb-6 w-full rounded-lg border object-cover" />
          ) : null}
          <h1 className="font-display text-3xl font-semibold">{product.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">By {product.seller?.name ?? "Career Forge"}</p>
          <div className="prose prose-sm mt-6 max-w-none whitespace-pre-wrap text-foreground">{product.description}</div>
        </div>

        <aside className="lg:col-span-1">
          <div className="rounded-lg border bg-card p-5">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-2xl font-semibold">
                {price === 0 ? "Free" : formatCurrency(price, product.currency)}
              </span>
              {discountIsActive(product) ? (
                <span className="text-sm text-muted-foreground line-through">
                  {formatCurrency(product.priceCents, product.currency)}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {product.deliveryType === "EXTERNAL_VIDEO"
                ? "Video · watch on Career Forge"
                : `${product.fileName || "File"} · instant download`}
            </p>
            <div className="mt-4">
              <BuyProductButton
                productId={product.id}
                isLoggedIn={Boolean(user)}
                owned={owned}
                slug={product.slug}
                deliveryType={product.deliveryType === "EXTERNAL_VIDEO" ? "EXTERNAL_VIDEO" : "FILE"}
              />
            </div>
          </div>

          <div className="mt-6 rounded-lg border bg-card p-5">
            <p className="mb-3 text-sm font-medium">Share this product</p>
            <SharePanel
              url={appUrl(`/products/${product.slug}`)}
              intro="Send this to anyone — they can buy it without creating an account."
              shareText={`"${product.title}" on Career Forge`}
            />
          </div>
        </aside>
      </main>
      <SiteFooter />
    </div>
  );
}
