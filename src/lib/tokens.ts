import { createHash, randomBytes } from "crypto";
import type { TokenType } from "@prisma/client";
import { db } from "@/lib/db";

/** Opaque token given to the user; only its SHA-256 hash is stored. */
export function createRawToken() {
  return randomBytes(32).toString("hex");
}

export function hashToken(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

export async function issueToken(params: {
  userId: string;
  type: TokenType;
  ttlMinutes: number;
  payload?: Record<string, unknown>;
}) {
  const raw = createRawToken();
  await db.verificationToken.create({
    data: {
      userId: params.userId,
      type: params.type,
      tokenHash: hashToken(raw),
      payload: params.payload as never,
      expiresAt: new Date(Date.now() + params.ttlMinutes * 60_000),
    },
  });
  return raw;
}

/** Consumes the token (single use). Returns the record or null if invalid/expired. */
export async function consumeToken(raw: string, type: TokenType) {
  const record = await db.verificationToken.findUnique({
    where: { tokenHash: hashToken(raw) },
  });
  if (!record || record.type !== type) return null;
  if (record.usedAt || record.expiresAt < new Date()) return null;
  await db.verificationToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });
  return record;
}
