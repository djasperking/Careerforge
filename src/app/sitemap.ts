import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { db } from "@/lib/db";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const now = new Date();

  const staticPaths: { path: string; priority: number; freq: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
    { path: "/", priority: 1, freq: "daily" },
    { path: "/courses", priority: 0.8, freq: "daily" },
    { path: "/products", priority: 0.7, freq: "daily" },
    { path: "/coaching", priority: 0.7, freq: "weekly" },
    { path: "/jobs", priority: 0.8, freq: "daily" },
    { path: "/blog", priority: 0.7, freq: "daily" },
    { path: "/newsletter", priority: 0.4, freq: "monthly" },
    { path: "/legal/terms", priority: 0.2, freq: "yearly" },
    { path: "/legal/privacy", priority: 0.2, freq: "yearly" },
    { path: "/legal/refund", priority: 0.2, freq: "yearly" },
    { path: "/register", priority: 0.5, freq: "monthly" },
    { path: "/login", priority: 0.3, freq: "monthly" },
  ];

  const entries: MetadataRoute.Sitemap = staticPaths.map((p) => ({
    url: `${base}${p.path}`,
    lastModified: now,
    changeFrequency: p.freq,
    priority: p.priority,
  }));

  try {
    const [courses, products, coaching, posts, jobs] = await Promise.all([
      db.course.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
      db.digitalProduct.findMany({
        where: { status: "PUBLISHED", reviewStatus: "APPROVED" },
        select: { slug: true, updatedAt: true },
      }),
      db.coachingOffer.findMany({
        where: { status: "PUBLISHED", reviewStatus: "APPROVED" },
        select: { slug: true, updatedAt: true },
      }),
      db.blogPost.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
      db.jobPost.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
    ]);

    const add = (prefix: string, rows: { slug: string; updatedAt: Date }[], priority: number) => {
      for (const r of rows) {
        entries.push({
          url: `${base}${prefix}/${r.slug}`,
          lastModified: r.updatedAt,
          changeFrequency: "weekly",
          priority,
        });
      }
    };
    add("/courses", courses, 0.7);
    add("/products", products, 0.6);
    add("/coaching", coaching, 0.6);
    add("/blog", posts, 0.6);
    add("/jobs", jobs, 0.6);
  } catch {
    // A DB hiccup shouldn't 500 the sitemap — return the static entries.
  }

  return entries;
}
