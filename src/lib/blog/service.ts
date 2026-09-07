import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";

export async function uniqueBlogSlug(title: string, excludeId?: string) {
  const base = slugify(title) || "post";
  let slug = base;
  let n = 1;
  while (await db.blogPost.findFirst({ where: { slug, NOT: excludeId ? { id: excludeId } : undefined } })) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

export async function listPublishedPosts(opts: { category?: string; take?: number } = {}) {
  return db.blogPost.findMany({
    where: {
      status: "PUBLISHED",
      ...(opts.category ? { categoryId: opts.category } : {}),
    },
    orderBy: { publishedAt: "desc" },
    take: opts.take ?? 50,
  });
}

export async function getPublishedPost(slug: string) {
  return db.blogPost.findFirst({ where: { slug, status: "PUBLISHED" } });
}

export async function listBlogCategories() {
  const rows = await db.blogPost.findMany({
    where: { status: "PUBLISHED", categoryId: { not: null } },
    select: { categoryId: true },
    distinct: ["categoryId"],
  });
  return rows.map((r) => r.categoryId!).filter(Boolean).sort();
}

/** Resolve author display names for a set of posts. */
export async function authorNames(ids: (string | null)[]): Promise<Map<string, string>> {
  const real = [...new Set(ids.filter((x): x is string => Boolean(x)))];
  if (real.length === 0) return new Map();
  const users = await db.user.findMany({ where: { id: { in: real } }, select: { id: true, name: true } });
  return new Map(users.map((u) => [u.id, u.name ?? "Career Forge"]));
}
