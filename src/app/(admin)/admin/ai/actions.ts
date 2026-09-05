"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermissionApi } from "@/lib/session";
import { audit } from "@/lib/audit";
import { ApiError } from "@/lib/api";
import { AI_FEATURE_KEYS, type AIFeatureKey } from "@/lib/ai/prompts";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };
function fail(err: unknown): Result<never> {
  if (err instanceof ApiError) return { ok: false, error: err.message };
  console.error(err);
  return { ok: false, error: "Something went wrong. Please try again." };
}

export async function createPromptVersion(input: {
  key: string;
  systemPrompt: string;
  userTemplate: string;
  notes?: string;
  activate: boolean;
}): Promise<Result<null>> {
  try {
    const admin = await requirePermissionApi("ai:prompts");
    if (!AI_FEATURE_KEYS.includes(input.key as AIFeatureKey)) {
      throw new ApiError(422, "BAD_KEY", "Unknown feature key.");
    }
    if (input.systemPrompt.trim().length < 10) {
      throw new ApiError(422, "TOO_SHORT", "System prompt is too short.");
    }

    const last = await db.aIPrompt.findFirst({ where: { key: input.key }, orderBy: { version: "desc" } });
    const version = (last?.version ?? 0) + 1;

    await db.$transaction(async (tx) => {
      if (input.activate) {
        await tx.aIPrompt.updateMany({ where: { key: input.key, isActive: true }, data: { isActive: false } });
      }
      await tx.aIPrompt.create({
        data: {
          key: input.key,
          version,
          systemPrompt: input.systemPrompt,
          userTemplate: input.userTemplate || "{{input}}",
          notes: input.notes || null,
          isActive: input.activate,
          createdBy: admin.id,
        },
      });
    });

    await audit({ actorId: admin.id, action: "AI_PROMPT_CREATED", entity: "AIPrompt", entityId: input.key, metadata: { version } });
    revalidatePath("/admin/ai");
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}

export async function setPromptActive(id: string, key: string, isActive: boolean): Promise<Result<null>> {
  try {
    const admin = await requirePermissionApi("ai:prompts");
    await db.$transaction(async (tx) => {
      if (isActive) {
        await tx.aIPrompt.updateMany({ where: { key, isActive: true }, data: { isActive: false } });
      }
      await tx.aIPrompt.update({ where: { id }, data: { isActive } });
    });
    await audit({ actorId: admin.id, action: isActive ? "AI_PROMPT_ACTIVATED" : "AI_PROMPT_DEACTIVATED", entity: "AIPrompt", entityId: id });
    revalidatePath("/admin/ai");
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}
