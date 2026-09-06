import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { userOwnsDigitalProduct } from "@/lib/marketplace/digital";
import { audit } from "@/lib/audit";
import { appUrl } from "@/lib/email";

/**
 * Entitlement-gated download. Redirects the buyer (or the seller) to the
 * stored file URL. Unauthorised visitors are bounced to login / the product
 * page rather than shown a JSON error, since this is opened as a link.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const product = await db.digitalProduct.findUnique({ where: { id } });
  if (!product) return Response.redirect(appUrl("/products"), 302);

  const user = await getCurrentUser();
  if (!user) return Response.redirect(appUrl(`/login?next=/products/${product.slug}`), 302);

  const owns = product.sellerId === user.id || (await userOwnsDigitalProduct(user.id, id));
  if (!owns) return Response.redirect(appUrl(`/products/${product.slug}`), 302);

  await audit({ actorId: user.id, action: "DIGITAL_PRODUCT_DOWNLOADED", entity: "DigitalProduct", entityId: id });
  return Response.redirect(product.fileUrl, 302);
}
