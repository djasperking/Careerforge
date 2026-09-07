"use server";

import { revalidatePath } from "next/cache";
import { requireUserApi } from "@/lib/session";
import { ApiError } from "@/lib/api";
import {
  postMessage,
  startConversation,
  setMuted,
  setArchived,
  searchMessageable,
} from "@/lib/messaging/service";

type Result<T = null> = { ok: true; data: T } | { ok: false; error: string };
function fail(err: unknown): Result<never> {
  if (err instanceof ApiError) return { ok: false, error: err.message };
  console.error(err);
  return { ok: false, error: "Something went wrong. Please try again." };
}

type Attachment = { url: string; name: string; type: string } | undefined;

export async function sendMessageAction(input: {
  conversationId: string;
  body: string;
  attachment?: Attachment;
}): Promise<Result> {
  try {
    const user = await requireUserApi();
    await postMessage(user.id, input.conversationId, input.body, input.attachment);
    revalidatePath(`/dashboard/messages/${input.conversationId}`);
    revalidatePath("/dashboard/messages");
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}

export async function startConversationAction(input: {
  toUserId: string;
  body: string;
  attachment?: Attachment;
}): Promise<Result<{ conversationId: string }>> {
  try {
    const user = await requireUserApi();
    const id = await startConversation(user.id, input.toUserId, input.body, input.attachment);
    revalidatePath("/dashboard/messages");
    return { ok: true, data: { conversationId: id } };
  } catch (err) {
    return fail(err);
  }
}

export async function setMutedAction(conversationId: string, muted: boolean): Promise<Result> {
  try {
    const user = await requireUserApi();
    await setMuted(user.id, conversationId, muted);
    revalidatePath(`/dashboard/messages/${conversationId}`);
    revalidatePath("/dashboard/messages");
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}

export async function setArchivedAction(conversationId: string, archived: boolean): Promise<Result> {
  try {
    const user = await requireUserApi();
    await setArchived(user.id, conversationId, archived);
    revalidatePath(`/dashboard/messages/${conversationId}`);
    revalidatePath("/dashboard/messages");
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}

export async function searchMessageableAction(q: string): Promise<
  Result<{ id: string; name: string; email: string }[]>
> {
  try {
    const user = await requireUserApi();
    const rows = await searchMessageable(user.id, q);
    return { ok: true, data: rows };
  } catch (err) {
    return fail(err);
  }
}
