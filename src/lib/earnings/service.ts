import { db } from "@/lib/db";
import { ApiError } from "@/lib/api";
import type { ProductType } from "@prisma/client";

const DEFAULT_HOLD_DAYS = 7;
const DEFAULT_MIN_PAYOUT_CENTS = 500_000; // ₦5,000

async function numSetting(key: string, fallback: number): Promise<number> {
  const row = await db.systemSetting.findUnique({ where: { key } });
  return typeof row?.value === "number" ? row.value : fallback;
}

export async function payoutConfig() {
  const [holdDays, minimumCents] = await Promise.all([
    numSetting("payouts.holdDays", DEFAULT_HOLD_DAYS),
    numSetting("payouts.minimumCents", DEFAULT_MIN_PAYOUT_CENTS),
  ]);
  return { holdDays, minimumCents };
}

/** Split a gross sale into the instructor's net and the platform fee (minor units). */
export function splitEarning(grossCents: number, sharePercent: number) {
  const pct = Math.min(100, Math.max(0, sharePercent));
  const netCents = Math.round((grossCents * pct) / 100);
  const feeCents = grossCents - netCents;
  return { netCents, feeCents };
}

/** Resolve which instructor earns from a transaction, and their agreed share. */
async function resolveEarningTarget(
  productType: ProductType,
  productId: string | null,
): Promise<{ instructorId: string; sharePercent: number } | null> {
  if (!productId) return null;
  if (productType === "COURSE") {
    const c = await db.course.findUnique({ where: { id: productId }, select: { instructorId: true, revenueSharePercent: true } });
    return c?.instructorId ? { instructorId: c.instructorId, sharePercent: c.revenueSharePercent } : null;
  }
  if (productType === "DIGITAL_PRODUCT") {
    const p = await db.digitalProduct.findUnique({ where: { id: productId }, select: { sellerId: true, revenueSharePercent: true } });
    return p ? { instructorId: p.sellerId, sharePercent: p.revenueSharePercent } : null;
  }
  if (productType === "COACHING") {
    const b = await db.coachingBooking.findUnique({
      where: { id: productId },
      select: { offer: { select: { coachId: true, revenueSharePercent: true } } },
    });
    return b?.offer ? { instructorId: b.offer.coachId, sharePercent: b.offer.revenueSharePercent } : null;
  }
  return null;
}

/**
 * Record what an instructor earned from a paid transaction. Idempotent on
 * transactionId. Platform-owned products (no instructor) record nothing.
 */
export async function recordEarningForTransaction(transactionId: string): Promise<void> {
  const tx = await db.transaction.findUnique({ where: { id: transactionId } });
  if (!tx || tx.status !== "SUCCESS") return;

  const existing = await db.instructorEarning.findUnique({ where: { transactionId } });
  if (existing) return;

  const target = await resolveEarningTarget(tx.productType, tx.productId);
  if (!target) return;

  const gross = tx.amountCents;
  const { netCents: net, feeCents: fee } = splitEarning(gross, target.sharePercent);
  const { holdDays } = await payoutConfig();

  await db.instructorEarning.create({
    data: {
      instructorId: target.instructorId,
      transactionId,
      productType: tx.productType,
      productId: tx.productId,
      description: tx.description,
      grossCents: gross,
      feeCents: fee,
      netCents: net,
      currency: tx.currency,
      sharePercent: target.sharePercent,
      status: "PENDING",
      availableAt: new Date(Date.now() + holdDays * 86_400_000),
    },
  });
}

/** Reverse an earning when its sale is refunded. */
export async function reverseEarningForTransaction(transactionId: string): Promise<void> {
  const earning = await db.instructorEarning.findUnique({ where: { transactionId } });
  if (!earning || earning.status === "REVERSED") return;
  await db.instructorEarning.update({
    where: { transactionId },
    data: {
      status: "REVERSED",
      payoutId: null,
    },
  });
}

/** True once an earning has cleared its hold window. */
function isCleared(e: { status: string; availableAt: Date }) {
  return e.status === "AVAILABLE" || (e.status === "PENDING" && e.availableAt.getTime() <= Date.now());
}

export async function getInstructorBalance(instructorId: string) {
  const earnings = await db.instructorEarning.findMany({
    where: { instructorId },
    select: { netCents: true, status: true, availableAt: true, payoutId: true },
  });
  let availableCents = 0;
  let pendingCents = 0;
  let inPayoutCents = 0;
  let lifetimeCents = 0;
  for (const e of earnings) {
    if (e.status === "REVERSED") continue;
    if (e.status === "PAID_OUT") {
      lifetimeCents += e.netCents;
      continue;
    }
    if (e.payoutId) {
      inPayoutCents += e.netCents;
    } else if (isCleared(e)) {
      availableCents += e.netCents;
    } else {
      pendingCents += e.netCents;
    }
  }
  return { availableCents, pendingCents, inPayoutCents, lifetimeCents };
}

export async function listInstructorEarnings(instructorId: string, take = 100) {
  return db.instructorEarning.findMany({
    where: { instructorId },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function savePayoutMethod(
  userId: string,
  input: { bankName: string; accountNumber: string; accountName: string },
) {
  const bankName = input.bankName.trim().slice(0, 120);
  const accountName = input.accountName.trim().slice(0, 120);
  const accountNumber = input.accountNumber.replace(/\s/g, "").slice(0, 32);
  if (!bankName || !accountName || !/^\d{6,20}$/.test(accountNumber)) {
    throw new ApiError(422, "BAD_PAYOUT_METHOD", "Enter a valid bank name, account name and account number.");
  }
  await db.instructorProfile.update({
    where: { userId },
    data: { payoutBankName: bankName, payoutAccountNumber: accountNumber, payoutAccountName: accountName },
  });
}

/** Instructor requests a payout of their whole cleared balance. */
export async function requestPayout(instructorId: string, note?: string) {
  const profile = await db.instructorProfile.findUnique({ where: { userId: instructorId } });
  if (!profile?.payoutBankName || !profile.payoutAccountNumber || !profile.payoutAccountName) {
    throw new ApiError(422, "NO_PAYOUT_METHOD", "Add your bank details before requesting a payout.");
  }

  const open = await db.payout.findFirst({
    where: { instructorId, status: { in: ["REQUESTED", "APPROVED"] } },
  });
  if (open) throw new ApiError(409, "PAYOUT_PENDING", "You already have a payout in progress.");

  const { minimumCents } = await payoutConfig();

  return db.$transaction(async (tx) => {
    const rows = await tx.instructorEarning.findMany({
      where: { instructorId, status: { in: ["PENDING", "AVAILABLE"] }, payoutId: null },
    });
    const cleared = rows.filter(isCleared);
    const amount = cleared.reduce((s, e) => s + e.netCents, 0);
    if (amount < minimumCents) {
      throw new ApiError(422, "BELOW_MINIMUM", `You need at least ${minimumCents / 100} in cleared earnings to request a payout.`);
    }

    const payout = await tx.payout.create({
      data: {
        instructorId,
        amountCents: amount,
        currency: cleared[0]?.currency ?? "NGN",
        bankName: profile.payoutBankName!,
        accountNumber: profile.payoutAccountNumber!,
        accountName: profile.payoutAccountName!,
        note: note?.trim().slice(0, 500) || null,
      },
    });
    await tx.instructorEarning.updateMany({
      where: { id: { in: cleared.map((e) => e.id) } },
      data: { payoutId: payout.id, status: "AVAILABLE" },
    });
    return payout;
  });
}

type Decision = "approve" | "reject" | "mark_paid";

export async function decidePayout(
  payoutId: string,
  adminId: string,
  decision: Decision,
  opts: { note?: string; reference?: string } = {},
) {
  const payout = await db.payout.findUnique({ where: { id: payoutId } });
  if (!payout) throw new ApiError(404, "NOT_FOUND", "Payout not found.");

  if (decision === "approve") {
    if (payout.status !== "REQUESTED") throw new ApiError(409, "BAD_STATE", "Only a requested payout can be approved.");
    return db.payout.update({
      where: { id: payoutId },
      data: { status: "APPROVED", decidedById: adminId, decidedAt: new Date(), adminNote: opts.note?.slice(0, 500) || null },
    });
  }

  if (decision === "reject") {
    if (payout.status !== "REQUESTED" && payout.status !== "APPROVED") {
      throw new ApiError(409, "BAD_STATE", "This payout can no longer be rejected.");
    }
    return db.$transaction(async (tx) => {
      await tx.instructorEarning.updateMany({ where: { payoutId }, data: { payoutId: null } });
      return tx.payout.update({
        where: { id: payoutId },
        data: { status: "REJECTED", decidedById: adminId, decidedAt: new Date(), adminNote: opts.note?.slice(0, 500) || null },
      });
    });
  }

  // mark_paid — the admin has sent the money outside the system.
  if (payout.status !== "APPROVED" && payout.status !== "REQUESTED") {
    throw new ApiError(409, "BAD_STATE", "Only an approved payout can be marked paid.");
  }
  return db.$transaction(async (tx) => {
    await tx.instructorEarning.updateMany({ where: { payoutId }, data: { status: "PAID_OUT" } });
    return tx.payout.update({
      where: { id: payoutId },
      data: {
        status: "PAID",
        paidAt: new Date(),
        decidedById: adminId,
        decidedAt: payout.decidedAt ?? new Date(),
        reference: opts.reference?.slice(0, 120) || null,
        adminNote: opts.note?.slice(0, 500) ?? payout.adminNote,
      },
    });
  });
}
