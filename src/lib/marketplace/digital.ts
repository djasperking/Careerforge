import { db } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { slugify } from "@/lib/utils";

export async function uniqueDigitalProductSlug(title: string, excludeId?: string) {
  const base = slugify(title) || "product";
  let slug = base;
  let n = 1;
  while (await db.digitalProduct.findFirst({ where: { slug, NOT: excludeId ? { id: excludeId } : undefined } })) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

/** Load a digital product the caller owns, or throw 404. */
export async function requireOwnedDigitalProduct(userId: string, id: string) {
  const product = await db.digitalProduct.findFirst({ where: { id, sellerId: userId } });
  if (!product) throw new ApiError(404, "NOT_FOUND", "Product not found.");
  return product;
}

/** True once the user has paid for this product (or is its seller / an admin). */
export async function userOwnsDigitalProduct(userId: string, productId: string) {
  const purchase = await db.digitalProductPurchase.findUnique({
    where: { productId_userId: { productId, userId } },
  });
  return Boolean(purchase);
}

/**
 * Decide whether a visitor may access a product's content — via a logged-in
 * session that owns it (or sells it) or an unguessable delivery-email token.
 * Mirrors the entitlement check in the download route so guest buyers can also
 * reach the watch page without an account.
 */
export async function resolveDigitalProductAccess(
  productId: string,
  opts: { userId?: string | null; token?: string | null },
): Promise<boolean> {
  if (opts.token) {
    const viaToken = await db.digitalProductPurchase.findFirst({
      where: { productId, downloadToken: opts.token },
      select: { id: true },
    });
    if (viaToken) return true;
  }
  if (opts.userId) {
    const product = await db.digitalProduct.findUnique({ where: { id: productId }, select: { sellerId: true } });
    if (product?.sellerId === opts.userId) return true;
    return userOwnsDigitalProduct(opts.userId, productId);
  }
  return false;
}
