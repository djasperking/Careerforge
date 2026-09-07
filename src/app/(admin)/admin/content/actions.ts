"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { requirePermissionApi } from "@/lib/session";
import { audit } from "@/lib/audit";
import { uniqueBlogSlug } from "@/lib/blog/service";

type Result<T = null> = { ok: true; data: T } | { ok: false; error: string };
function fail(err: unknown): Result<never> {
  if (err instanceof ApiError) return { ok: false, error: err.message };
  if (err instanceof z.ZodError) return { ok: false, error: err.issues[0]?.message ?? "Check the form." };
  console.error(err);
  return { ok: false, error: "Something went wrong. Please try again." };
}

const postSchema = z.object({
  title: z.string().min(3).max(200),
  excerpt: z.string().max(400).optional(),
  category: z.string().max(60).optional(),
  coverUrl: z.string().url().or(z.literal("")).optional(),
  body: z.string().min(20).max(80_000),
});

function toData(d: z.infer<typeof postSchema>) {
  return {
    title: d.title.trim(),
    excerpt: d.excerpt?.trim() || null,
    categoryId: d.category?.trim() || null,
    coverUrl: d.coverUrl || null,
    body: d.body.trim(),
  };
}

export async function createPost(input: unknown): Promise<Result<{ id: string }>> {
  try {
    const admin = await requirePermissionApi("content:write");
    const d = postSchema.parse(input);
    const data = toData(d);
    const slug = await uniqueBlogSlug(data.title);
    const post = await db.blogPost.create({ data: { ...data, slug, authorId: admin.id } });
    await audit({ actorId: admin.id, action: "BLOG_CREATED", entity: "BlogPost", entityId: post.id });
    revalidatePath("/admin/content");
    return { ok: true, data: { id: post.id } };
  } catch (err) {
    return fail(err);
  }
}

export async function updatePost(id: string, input: unknown): Promise<Result> {
  try {
    const admin = await requirePermissionApi("content:write");
    const d = postSchema.parse(input);
    await db.blogPost.update({ where: { id }, data: toData(d) });
    await audit({ actorId: admin.id, action: "BLOG_UPDATED", entity: "BlogPost", entityId: id });
    revalidatePath("/admin/content");
    revalidatePath(`/admin/content/${id}`);
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}

export async function setPostStatus(id: string, status: "DRAFT" | "PUBLISHED" | "ARCHIVED"): Promise<Result> {
  try {
    const admin = await requirePermissionApi("content:write");
    const post = await db.blogPost.findUnique({ where: { id } });
    if (!post) throw new ApiError(404, "NOT_FOUND", "Post not found.");
    await db.blogPost.update({
      where: { id },
      data: { status, publishedAt: status === "PUBLISHED" && !post.publishedAt ? new Date() : post.publishedAt },
    });
    await audit({ actorId: admin.id, action: "BLOG_STATUS", entity: "BlogPost", entityId: id, metadata: { status } });
    revalidatePath("/admin/content");
    revalidatePath(`/admin/content/${id}`);
    revalidatePath("/blog");
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}

export async function deletePost(id: string): Promise<Result> {
  try {
    const admin = await requirePermissionApi("content:write");
    await db.blogPost.delete({ where: { id } });
    await audit({ actorId: admin.id, action: "BLOG_DELETED", entity: "BlogPost", entityId: id });
    revalidatePath("/admin/content");
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}
