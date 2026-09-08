import { db } from "@/lib/db";
import { ROLES } from "@/lib/rbac";
import { findUserBySameInbox } from "@/lib/email-identity";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function normalizeEmail(raw: string) {
  return raw.trim().toLowerCase();
}

export function isValidEmail(raw: string) {
  return EMAIL_RE.test(normalizeEmail(raw));
}

/**
 * Get the user for a guest checkout. If no account has this email we create a
 * passwordless one (status PENDING, CUSTOMER role) so the rest of the billing
 * pipeline — purchases, receipts, entitlements — works unchanged. The buyer
 * can later claim it by setting a password via the normal reset flow.
 *
 * Returns `isNew` so the caller can tailor the delivery email.
 */
export async function findOrCreateGuestUser(
  rawEmail: string,
  rawName: string,
): Promise<{ userId: string; isNew: boolean; hasPassword: boolean }> {
  const email = normalizeEmail(rawEmail);
  const name = rawName.trim().slice(0, 120) || null;

  const existing =
    (await db.user.findUnique({ where: { email }, select: { id: true, passwordHash: true } })) ??
    // Reuse an account from the same real inbox rather than creating a near-duplicate.
    (await (async () => {
      const same = await findUserBySameInbox(rawEmail);
      return same
        ? db.user.findUnique({ where: { id: same.id }, select: { id: true, passwordHash: true } })
        : null;
    })());
  if (existing) {
    return { userId: existing.id, isNew: false, hasPassword: Boolean(existing.passwordHash) };
  }

  const customerRole = await db.role.upsert({
    where: { key: ROLES.CUSTOMER },
    update: {},
    create: { key: ROLES.CUSTOMER, name: "Customer", isSystem: true },
  });

  const user = await db.user.create({
    data: {
      email,
      name,
      status: "PENDING",
      roles: { create: { roleId: customerRole.id } },
      profile: { create: {} },
    },
    select: { id: true },
  });
  return { userId: user.id, isNew: true, hasPassword: false };
}
