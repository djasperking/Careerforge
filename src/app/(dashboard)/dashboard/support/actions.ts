"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUserApi } from "@/lib/session";
import { audit } from "@/lib/audit";
import { ApiError } from "@/lib/api";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };
function fail(err: unknown): Result<never> {
  if (err instanceof ApiError) return { ok: false, error: err.message };
  console.error(err);
  return { ok: false, error: "Something went wrong. Please try again." };
}

const CATEGORIES = ["PAYMENT", "COURSE", "ACCOUNT", "CV", "TECHNICAL", "OTHER"] as const;

export async function createSupportTicket(input: {
  category: string;
  subject: string;
  message: string;
}): Promise<Result<{ id: string }>> {
  try {
    const user = await requireUserApi();
    if (!(CATEGORIES as readonly string[]).includes(input.category)) {
      throw new ApiError(422, "BAD_CATEGORY", "Choose a valid category.");
    }
    if (input.subject.trim().length < 3) throw new ApiError(422, "SUBJECT_TOO_SHORT", "Enter a subject.");
    if (input.message.trim().length < 5) throw new ApiError(422, "MESSAGE_TOO_SHORT", "Describe the issue.");

    const ticket = await db.supportTicket.create({
      data: {
        userId: user.id,
        category: input.category,
        subject: input.subject.trim().slice(0, 200),
        messages: { create: { authorId: user.id, body: input.message.trim() } },
      },
    });
    await audit({ actorId: user.id, action: "SUPPORT_TICKET_CREATED", entity: "SupportTicket", entityId: ticket.id });
    revalidatePath("/dashboard/support");
    return { ok: true, data: { id: ticket.id } };
  } catch (err) {
    return fail(err);
  }
}

export async function replyToTicket(ticketId: string, body: string): Promise<Result<null>> {
  try {
    const user = await requireUserApi();
    const ticket = await db.supportTicket.findFirst({ where: { id: ticketId, userId: user.id } });
    if (!ticket) throw new ApiError(404, "NOT_FOUND", "Ticket not found.");
    if (body.trim().length < 1) throw new ApiError(422, "EMPTY", "Type a message.");

    await db.$transaction([
      db.ticketMessage.create({ data: { ticketId, authorId: user.id, body: body.trim() } }),
      db.supportTicket.update({
        where: { id: ticketId },
        data: { status: ticket.status === "RESOLVED" || ticket.status === "CLOSED" ? "OPEN" : "PENDING" },
      }),
    ]);
    revalidatePath(`/dashboard/support/${ticketId}`);
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}
