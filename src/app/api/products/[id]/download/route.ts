import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { userOwnsDigitalProduct } from "@/lib/marketplace/digital";
import { audit } from "@/lib/audit";
import { appUrl } from "@/lib/email";

/**
 * Entitlement-gated download. Redirects the buyer (or the seller) to the
 * stored file URL. Access is granted by either a logged-in session that owns
 * the product, or an unguessable `?token=` from the delivery email (so guest
 * buyers can download without an account). Unauthorised visitors are bounced
 * to login / the product page rather than shown a JSON error.
 */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const product = await db.digitalProduct.findUnique({ where: { id } });
  if (!product) return Response.redirect(appUrl("/products"), 302);

  // Video products have nothing to download — send them to the watch page.
  if (product.deliveryType === "EXTERNAL_VIDEO") {
    const t = new URL(req.url).searchParams.get("token");
    return Response.redirect(appUrl(`/products/${product.slug}/watch${t ? `?token=${t}` : ""}`), 302);
  }

  const token = new URL(req.url).searchParams.get("token");
  if (token) {
    const purchase = await db.digitalProductPurchase.findFirst({
      where: { productId: id, downloadToken: token },
      select: { id: true, userId: true },
    });
    if (purchase) {
      await audit({
        actorId: purchase.userId,
        action: "DIGITAL_PRODUCT_DOWNLOADED",
        entity: "DigitalProduct",
        entityId: id,
        metadata: { via: "token" },
      });
      return Response.redirect(product.fileUrl, 302);
    }
  }

  const user = await getCurrentUser();
  if (!user) return Response.redirect(appUrl(`/login?next=/products/${product.slug}`), 302);

  const owns = product.sellerId === user.id || (await userOwnsDigitalProduct(user.id, id));
  if (!owns) return Response.redirect(appUrl(`/products/${product.slug}`), 302);

  await audit({ actorId: user.id, action: "DIGITAL_PRODUCT_DOWNLOADED", entity: "DigitalProduct", entityId: id });
  return Response.redirect(product.fileUrl, 302);
}
