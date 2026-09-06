import { db } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { slugify } from "@/lib/utils";

export async function uniqueCoachingSlug(title: string, excludeId?: string) {
  const base = slugify(title) || "coaching";
  let slug = base;
  let n = 1;
  while (await db.coachingOffer.findFirst({ where: { slug, NOT: excludeId ? { id: excludeId } : undefined } })) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

/** Load a coaching offer the caller owns, or throw 404. */
export async function requireOwnedCoachingOffer(userId: string, id: string) {
  const offer = await db.coachingOffer.findFirst({ where: { id, coachId: userId } });
  if (!offer) throw new ApiError(404, "NOT_FOUND", "Offer not found.");
  return offer;
}
