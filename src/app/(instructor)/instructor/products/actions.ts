"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUserApi } from "@/lib/session";
import { ApiError } from "@/lib/api";
import { audit } from "@/lib/audit";
import { assertCanSellDigitalProducts as assertCanSell } from "@/lib/instructor/service";
import { uniqueDigitalProductSlug, requireOwnedDigitalProduct } from "@/lib/marketplace/digital";
import { parseVideoUrl } from "@/lib/marketplace/video";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };
function fail(err: unknown): Result<never> {
  if (err instanceof ApiError) return { ok: false, error: err.message };
  console.error(err);
  return { ok: false, error: "Something went wrong. Please try again." };
}

const productSchema = z
  .object({
    title: z.string().min(3).max(160),
    description: z.string().min(20).max(4000),
    coverImageUrl: z.string().max(400).optional().or(z.literal("")),
    deliveryType: z.enum(["FILE", "EXTERNAL_VIDEO", "HOSTED_VIDEO"]).default("FILE"),
    fileUrl: z.string().max(600).optional().or(z.literal("")),
    fileName: z.string().max(200).default("download"),
    fileSizeBytes: z.coerce.number().int().min(0).default(0),
    videoUrl: z.string().max(600).optional().or(z.literal("")),
    videoAssetId: z.string().max(120).optional().or(z.literal("")),
    videoDurationSec: z.coerce.number().int().min(0).optional(),
    priceCents: z.coerce.number().int().min(0).max(100_000_000),
    currency: z.string().min(3).max(3).default("NGN"),
    discountPercent: z.coerce.number().int().min(0).max(90).optional(),
    discountEndsAt: z.string().optional().or(z.literal("")),
  })
  .superRefine((val, ctx) => {
    if (val.deliveryType === "FILE") {
      if (!val.fileUrl || !/^https?:\/\//.test(val.fileUrl)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["fileUrl"], message: "Upload the product file first." });
      }
    } else if (val.deliveryType === "EXTERNAL_VIDEO") {
      if (!val.videoUrl || !parseVideoUrl(val.videoUrl)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["videoUrl"],
          message: "Paste a valid YouTube, Vimeo or Loom link.",
        });
      }
    } else if (val.deliveryType === "HOSTED_VIDEO") {
      if (!val.videoAssetId) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["videoAssetId"], message: "Upload the video first." });
      }
    }
  });

/** Normalise the delivery fields so only the relevant ones are stored. */
function deliveryData(input: z.infer<typeof productSchema>) {
  if (input.deliveryType === "EXTERNAL_VIDEO") {
    const parsed = parseVideoUrl(input.videoUrl ?? "")!;
    return {
      deliveryType: "EXTERNAL_VIDEO",
      fileUrl: "",
      fileName: "",
      fileSizeBytes: 0,
      videoUrl: parsed.embedUrl,
      videoProvider: parsed.provider,
      videoAssetId: null,
      videoDurationSec: input.videoDurationSec ?? null,
    };
  }
  if (input.deliveryType === "HOSTED_VIDEO") {
    return {
      deliveryType: "HOSTED_VIDEO",
      fileUrl: "",
      fileName: "",
      fileSizeBytes: 0,
      videoUrl: null,
      videoProvider: "bunny",
      videoAssetId: input.videoAssetId || null,
      videoDurationSec: input.videoDurationSec ?? null,
    };
  }
  return {
    deliveryType: "FILE",
    fileUrl: input.fileUrl || "",
    fileName: input.fileName || "download",
    fileSizeBytes: input.fileSizeBytes,
    videoUrl: null,
    videoProvider: null,
    videoAssetId: null,
    videoDurationSec: null,
  };
}

export async function createMyProduct(raw: unknown): Promise<Result<{ id: string }>> {
  try {
    const user = await requireUserApi();
    const { isStaff } = await assertCanSell(user);
    const input = productSchema.parse(raw);
    const slug = await uniqueDigitalProductSlug(input.title);

    const product = await db.digitalProduct.create({
      data: {
        slug,
        sellerId: user.id,
        title: input.title,
        description: input.description,
        coverImageUrl: input.coverImageUrl || null,
        ...deliveryData(input),
        priceCents: input.priceCents,
        currency: input.currency,
        discountPercent: input.discountPercent && input.discountPercent > 0 ? input.discountPercent : null,
        discountEndsAt: input.discountEndsAt ? new Date(input.discountEndsAt) : null,
        status: "DRAFT",
        // Staff-authored products skip the review queue, like admin-authored courses.
        ...(isStaff
          ? { reviewStatus: "APPROVED", reviewedAt: new Date(), reviewedById: user.id }
          : { reviewStatus: "DRAFT" }),
      },
    });
    await audit({ actorId: user.id, action: "DIGITAL_PRODUCT_CREATED", entity: "DigitalProduct", entityId: product.id });
    revalidatePath("/instructor/products");
    return { ok: true, data: { id: product.id } };
  } catch (err) {
    return fail(err);
  }
}

export async function updateMyProduct(id: string, raw: unknown): Promise<Result<null>> {
  try {
    const user = await requireUserApi();
    const { isStaff } = await assertCanSell(user);
    const product = await requireOwnedDigitalProduct(user.id, id);
    if (product.reviewStatus === "SUBMITTED") throw new ApiError(409, "LOCKED", "This product is awaiting review.");
    const input = productSchema.parse(raw);
    const slug = product.title === input.title ? product.slug : await uniqueDigitalProductSlug(input.title, id);

    // Instructors: editing an approved product sends it back for re-review.
    // Staff edits keep the product live.
    const demote = !isStaff && product.reviewStatus === "APPROVED";

    await db.digitalProduct.update({
      where: { id },
      data: {
        slug,
        title: input.title,
        description: input.description,
        coverImageUrl: input.coverImageUrl || null,
        ...deliveryData(input),
        priceCents: input.priceCents,
        currency: input.currency,
        discountPercent: input.discountPercent && input.discountPercent > 0 ? input.discountPercent : null,
        discountEndsAt: input.discountEndsAt ? new Date(input.discountEndsAt) : null,
        reviewStatus: demote ? "DRAFT" : product.reviewStatus,
        status: demote ? "DRAFT" : product.status,
      },
    });
    await audit({ actorId: user.id, action: "DIGITAL_PRODUCT_UPDATED", entity: "DigitalProduct", entityId: id });
    revalidatePath(`/instructor/products/${id}`);
    revalidatePath("/instructor/products");
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}

export async function submitProductForReview(id: string): Promise<Result<null>> {
  try {
    const user = await requireUserApi();
    await assertCanSell(user);
    const product = await requireOwnedDigitalProduct(user.id, id);
    if (product.reviewStatus === "SUBMITTED") throw new ApiError(409, "ALREADY_SUBMITTED", "Already submitted for review.");
    if (product.reviewStatus === "APPROVED") throw new ApiError(409, "ALREADY_APPROVED", "This product is already approved.");
    if (product.deliveryType === "EXTERNAL_VIDEO") {
      if (!product.videoUrl) throw new ApiError(422, "NO_VIDEO", "Add the video link before submitting.");
    } else if (product.deliveryType === "HOSTED_VIDEO") {
      if (!product.videoAssetId) throw new ApiError(422, "NO_VIDEO", "Upload the video before submitting.");
    } else if (!product.fileUrl) {
      throw new ApiError(422, "NO_FILE", "Attach the product file before submitting.");
    }
    if (product.description.trim().length < 20) throw new ApiError(422, "THIN_DESCRIPTION", "Write a fuller description before submitting.");

    await db.digitalProduct.update({
      where: { id },
      data: { reviewStatus: "SUBMITTED", submittedAt: new Date(), reviewNote: null },
    });
    await audit({ actorId: user.id, action: "DIGITAL_PRODUCT_SUBMITTED", entity: "DigitalProduct", entityId: id });

    const reviewers = await db.user.findMany({
      where: { roles: { some: { role: { permissions: { some: { permission: { key: "instructors:review" } } } } } } },
      select: { id: true },
      take: 25,
    });
    await db.notification.createMany({
      data: reviewers.map((r) => ({
        userId: r.id,
        type: "ANNOUNCEMENT",
        title: "Digital product awaiting review",
        body: `"${product.title}" was submitted for review.`,
        linkUrl: "/admin/review",
      })),
    });

    revalidatePath(`/instructor/products/${id}`);
    revalidatePath("/instructor/products");
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}

export async function setMyProductPublished(id: string, publish: boolean): Promise<Result<null>> {
  try {
    const user = await requireUserApi();
    await assertCanSell(user);
    const product = await requireOwnedDigitalProduct(user.id, id);
    if (publish && product.reviewStatus !== "APPROVED") {
      throw new ApiError(409, "NOT_APPROVED", "Only an approved product can be published.");
    }
    await db.digitalProduct.update({
      where: { id },
      data: {
        status: publish ? "PUBLISHED" : "UNPUBLISHED",
        publishedAt: publish && !product.publishedAt ? new Date() : product.publishedAt,
      },
    });
    await audit({ actorId: user.id, action: publish ? "DIGITAL_PRODUCT_PUBLISHED" : "DIGITAL_PRODUCT_UNPUBLISHED", entity: "DigitalProduct", entityId: id });
    revalidatePath(`/instructor/products/${id}`);
    revalidatePath("/instructor/products");
    revalidatePath("/products");
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}

export async function reopenMyProduct(id: string): Promise<Result<null>> {
  try {
    const user = await requireUserApi();
    await assertCanSell(user);
    const product = await requireOwnedDigitalProduct(user.id, id);
    if (product.reviewStatus === "SUBMITTED") throw new ApiError(409, "LOCKED", "Wait for the current review to finish.");
    await db.digitalProduct.update({
      where: { id },
      data: { reviewStatus: "DRAFT", status: product.status === "PUBLISHED" ? "DRAFT" : product.status },
    });
    revalidatePath(`/instructor/products/${id}`);
    revalidatePath("/products");
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}
