import { db } from "@/lib/db";

/** Append an audit record. Never throws into the caller's happy path. */
export async function audit(params: {
  actorId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  ip?: string | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    await db.auditLog.create({
      data: {
        actorId: params.actorId ?? null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId ?? null,
        ip: params.ip ?? null,
        metadata: params.metadata as never,
      },
    });
  } catch (err) {
    console.error("audit log write failed", err);
  }
}
