import { db } from "@/lib/db";

/**
 * The "identity" form of an email address — collapses provider-side aliasing so
 * one real inbox can't be used to create several accounts:
 *   - strips a "+tag" suffix from the local part (supported by Gmail, Outlook,
 *     iCloud, Fastmail, Proton and most modern providers, plus catch-all domains)
 *   - for Gmail, also removes dots ("j.smith@gmail.com" == "jsmith@gmail.com")
 *
 * The address the user typed is still what we STORE and send to — this is only
 * used to detect near-duplicate signups.
 */
export function canonicalEmail(raw: string): string {
  const email = raw.trim().toLowerCase();
  const at = email.lastIndexOf("@");
  if (at < 1 || at === email.length - 1) return email;

  let local = email.slice(0, at);
  let domain = email.slice(at + 1);

  const plus = local.indexOf("+");
  if (plus >= 0) local = local.slice(0, plus);

  if (domain === "googlemail.com") domain = "gmail.com";
  if (domain === "gmail.com") local = local.replace(/\./g, "");

  return `${local}@${domain}`;
}

/** Whether the entered address differs from its identity form (i.e. worth checking). */
export function isAliasedEmail(raw: string): boolean {
  return canonicalEmail(raw) !== raw.trim().toLowerCase();
}

/**
 * Returns an existing user whose email resolves to the same inbox as `rawEmail`,
 * or null. Only runs a query when the entered address is aliased, so the common
 * (already-canonical) signup path costs nothing extra.
 */
export async function findUserBySameInbox(rawEmail: string): Promise<{ id: string; email: string } | null> {
  if (!isAliasedEmail(rawEmail)) return null;
  const canonical = canonicalEmail(rawEmail);
  const domain = canonical.slice(canonical.lastIndexOf("@") + 1);
  const candidates = await db.user.findMany({
    where: { email: { endsWith: `@${domain}` } },
    select: { id: true, email: true },
  });
  return candidates.find((u) => canonicalEmail(u.email) === canonical) ?? null;
}
