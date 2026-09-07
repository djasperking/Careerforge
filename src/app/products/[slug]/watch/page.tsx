import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { audit } from "@/lib/audit";
import { resolveDigitalProductAccess } from "@/lib/marketplace/digital";
import { bunnyEmbedUrl, bunnyEnabled } from "@/lib/video/bunny";

export const metadata = { title: "Watch" };

export default async function ProductWatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { slug } = await params;
  const { token } = await searchParams;

  const [product, user] = await Promise.all([
    db.digitalProduct.findFirst({ where: { slug }, include: { seller: true } }),
    getCurrentUser(),
  ]);
  if (!product) notFound();

  const allowed = await resolveDigitalProductAccess(product.id, { userId: user?.id, token });
  if (!allowed) {
    if (!user && !token) redirect(`/login?next=/products/${slug}/watch`);
    redirect(`/products/${slug}`);
  }

  if (product.deliveryType === "FILE") {
    // Nothing to watch — send them to the gated download instead.
    redirect(`/api/products/${product.id}/download${token ? `?token=${token}` : ""}`);
  }

  await audit({
    actorId: user?.id ?? null,
    action: "DIGITAL_PRODUCT_WATCHED",
    entity: "DigitalProduct",
    entityId: product.id,
    metadata: { via: token ? "token" : "session" },
  }).catch(() => {});

  const playerSrc =
    product.deliveryType === "HOSTED_VIDEO"
      ? product.videoAssetId && bunnyEnabled()
        ? bunnyEmbedUrl(product.videoAssetId)
        : null
      : product.videoUrl;

  return (
    <div className="min-h-screen">
      <MarketingHeader loggedIn={Boolean(user)} />

      <main className="container max-w-4xl py-10">
        <h1 className="font-display text-2xl font-semibold">{product.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">By {product.seller?.name ?? "Career Forge"}</p>

        {playerSrc ? (
          <div className="mt-6 aspect-video w-full overflow-hidden rounded-lg border bg-black">
            <iframe
              src={playerSrc}
              title={product.title}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
            />
          </div>
        ) : (
          <p className="mt-6 text-sm text-muted-foreground">This video isn&apos;t available yet. Please check back later.</p>
        )}

        <div className="prose prose-sm mt-8 max-w-none whitespace-pre-wrap text-foreground">{product.description}</div>

        <p className="mt-8 text-sm">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/purchases">Back to my purchases</Link>
          </Button>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
