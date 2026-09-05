"use server";

import { revalidatePath } from "next/cache";
import { requirePermissionApi } from "@/lib/session";
import { audit } from "@/lib/audit";
import { ApiError } from "@/lib/api";
import { refundTransaction } from "@/lib/billing/service";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };
function fail(err: unknown): Result<never> {
  if (err instanceof ApiError) return { ok: false, error: err.message };
  console.error(err);
  return { ok: false, error: "Something went wrong. Please try again." };
}

export async function issueRefund(transactionId: string): Promise<Result<null>> {
  try {
    const admin = await requirePermissionApi("payments:refund");
    await refundTransaction(transactionId);
    await audit({ actorId: admin.id, action: "PAYMENT_REFUNDED", entity: "Transaction", entityId: transactionId });
    revalidatePath("/admin/payments");
    revalidatePath("/dashboard/payments");
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}
