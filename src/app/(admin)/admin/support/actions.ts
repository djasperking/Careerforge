"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermissionApi } from "@/lib/session";
import { audit } from "@/lib/audit";
import { ApiError } from "@/lib/api";
import { sendEmail } from "@/lib/email";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };
function fail(err: unknown): Result<never> {
  if (err instanceof ApiError) return { ok: false, error: err.message };
  console.error(err);
  return { ok: false, error: "Something went wrong. Please try again." };
}

export async function replyToTicketAsAdmin(input: {
  ticketId: string;
  body: string;
  isInternalNote: boolean;
}): Promise<Result<null>> {
  try {
    const admin = await requirePermissionApi("support:handle");
    if (input.body.trim().length < 1) throw new ApiError(422, "EMPTY", "Type a message.");

    const ticket = await db.supportTicket.findUniqueOrThrow({ where: { id: input.ticketId }, include: { user: true } });
    await db.ticketMessage.create({
      data: { ticketId: input.ticketId, authorId: admin.id, body: input.body.trim(), isInternalNote: input.isInternalNote },
    });

    if (!input.isInternalNote) {
      await db.supportTicket.update({ where: { id: input.ticketId }, data: { status: "PENDING" } });
      await db.notification.create({
        data: {
          userId: ticket.userId,
          type: "ANNOUNCEMENT",
          title: "Support replied to your ticket",
          body: ticket.subject,
          linkUrl: `/dashboard/support/${ticket.id}`,
        },
      });
      await sendEmail({
        to: ticket.user.email,
        template: "support-reply",
        subject: `Re: ${ticket.subject}`,
        data: { body: input.body.trim() },
      }).catch(() => {});
    }

    await audit({ actorId: admin.id, action: input.isInternalNote ? "SUPPORT_NOTE_ADDED" : "SUPPORT_REPLY_SENT", entity: "SupportTicket", entityId: input.ticketId });
    revalidatePath(`/admin/support/${input.ticketId}`);
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}

export async function setTicketStatusAdmin(ticketId: string, status: "OPEN" | "PENDING" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"): Promise<Result<null>> {
  try {
    const admin = await requirePermissionApi("support:handle");
    await db.supportTicket.update({ where: { id: ticketId }, data: { status } });
    await audit({ actorId: admin.id, action: `SUPPORT_TICKET_${status}`, entity: "SupportTicket", entityId: ticketId });
    revalidatePath(`/admin/support/${ticketId}`);
    revalidatePath("/admin/support");
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}

export async function assignTicket(ticketId: string, assigneeId: string | null): Promise<Result<null>> {
  try {
    const admin = await requirePermissionApi("support:handle");
    await db.supportTicket.update({ where: { id: ticketId }, data: { assignedToId: assigneeId } });
    await audit({ actorId: admin.id, action: "SUPPORT_TICKET_ASSIGNED", entity: "SupportTicket", entityId: ticketId, metadata: { assigneeId } });
    revalidatePath(`/admin/support/${ticketId}`);
    revalidatePath("/admin/support");
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}
