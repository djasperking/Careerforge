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
