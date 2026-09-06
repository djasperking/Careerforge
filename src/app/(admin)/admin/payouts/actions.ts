"use server";

import { revalidatePath } from "next/cache";
import { requirePermissionApi } from "@/lib/session";
import { ApiError } from "@/lib/api";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { decidePayout } from "@/lib/earnings/service";

type Result = { ok: true } | { ok: false; error: string };

function fail(err: unknown): Result {
  if (err instanceof ApiError) return { ok: false, error: err.message };
  console.error(err);
  return { ok: false, error: "Something went wrong. Please try again." };
}

export async function decidePayoutAction(input: {
  payoutId: string;
  decision: "approve" | "reject" | "mark_paid";
  note?: string;
  reference?: string;
}): Promise<Result> {
  try {
    const admin = await requirePermissionApi("payouts:manage");
    const payout = await decidePayout(input.payoutId, admin.id, input.decision, {
      note: input.note,
      reference: input.reference,
    });

    await audit({
      actorId: admin.id,
      action: `PAYOUT_${input.decision.toUpperCase()}`,
      entity: "Payout",
      entityId: payout.id,
      metadata: { amountCents: payout.amountCents, reference: input.reference ?? null },
    });

    const instructor = await db.user.findUnique({ where: { id: payout.instructorId }, select: { name: true } });
    const titleByDecision = {
      approve: "Payout approved",
      reject: "Payout rejected",
      mark_paid: "Payout sent",
    } as const;
    await db.notification.create({
      data: {
        userId: payout.instructorId,
        type: "PAYMENT",
        title: titleByDecision[input.decision],
        body:
          input.decision === "mark_paid"
            ? `Your payout has been sent to your bank account.${input.reference ? ` Ref: ${input.reference}` : ""}`
            : input.decision === "reject"
              ? `Your payout request was rejected.${input.note ? ` ${input.note}` : ""}`
              : "Your payout request was approved and is being processed.",
        linkUrl: "/instructor/earnings",
      },
    }).catch(() => {});
    void instructor;

    revalidatePath("/admin/payouts");
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}
