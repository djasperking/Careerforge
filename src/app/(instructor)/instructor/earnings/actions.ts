"use server";

import { revalidatePath } from "next/cache";
import { requireUserApi } from "@/lib/session";
import { ApiError } from "@/lib/api";
import { audit } from "@/lib/audit";
import { requireApprovedInstructor } from "@/lib/instructor/service";
import { savePayoutMethod, requestPayout } from "@/lib/earnings/service";

type Result = { ok: true } | { ok: false; error: string };

function fail(err: unknown): Result {
  if (err instanceof ApiError) return { ok: false, error: err.message };
  console.error(err);
  return { ok: false, error: "Something went wrong. Please try again." };
}

export async function savePayoutMethodAction(input: {
  bankName: string;
  accountNumber: string;
  accountName: string;
}): Promise<Result> {
  try {
    const user = await requireUserApi();
    await requireApprovedInstructor(user.id);
    await savePayoutMethod(user.id, input);
    revalidatePath("/instructor/earnings");
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

export async function requestPayoutAction(note?: string): Promise<Result> {
  try {
    const user = await requireUserApi();
    await requireApprovedInstructor(user.id);
    const payout = await requestPayout(user.id, note);
    await audit({
      actorId: user.id,
      action: "PAYOUT_REQUESTED",
      entity: "Payout",
      entityId: payout.id,
      metadata: { amountCents: payout.amountCents },
    });
    revalidatePath("/instructor/earnings");
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}
