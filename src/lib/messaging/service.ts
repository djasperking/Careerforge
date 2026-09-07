import { db } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { isAdminRole } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";

async function roleKeys(userId: string): Promise<string[]> {
  const u = await db.user.findUnique({
    where: { id: userId },
    select: { roles: { select: { role: { select: { key: true } } } } },
  });
  return (u?.roles ?? []).map((r) => r.role.key);
}

export async function isStaff(userId: string) {
  const keys = await roleKeys(userId);
  return isAdminRole(keys) || keys.includes("INSTRUCTOR");
}

/** Who may start a new conversation with whom. Replies are always allowed. */
export async function assertCanMessage(fromId: string, toId: string) {
  if (fromId === toId) throw new ApiError(422, "SELF", "You can't message yourself.");
  const target = await db.user.findUnique({ where: { id: toId }, select: { id: true, deletedAt: true } });
  if (!target || target.deletedAt) throw new ApiError(404, "NOT_FOUND", "That person isn't available.");
  if (await isStaff(fromId)) return; // staff can reach anyone
  if (await isStaff(toId)) return; // customers can reach staff
  throw new ApiError(403, "CANT_MESSAGE", "You can message instructors and the Career Forge team.");
}

export async function findOrCreateDirectConversation(a: string, b: string) {
  const existing = await db.conversation.findFirst({
    where: {
      participants: { every: { userId: { in: [a, b] } } },
      AND: [{ participants: { some: { userId: a } } }, { participants: { some: { userId: b } } }],
    },
    include: { participants: true },
  });
  if (existing && existing.participants.length === 2) return existing;

  return db.conversation.create({
    data: {
      participants: { create: [{ userId: a }, { userId: b }] },
    },
    include: { participants: true },
  });
}

export type InboxRow = {
  id: string;
  other: { id: string; name: string };
  lastMessage: string;
  lastMessageAt: Date;
  unread: boolean;
  muted: boolean;
};

export async function listInbox(userId: string, opts: { archived?: boolean } = {}): Promise<InboxRow[]> {
  const parts = await db.conversationParticipant.findMany({
    where: {
      userId,
      archivedAt: opts.archived ? { not: null } : null,
    },
    include: {
      conversation: {
        include: {
          participants: { include: { user: { select: { id: true, name: true, email: true } } } },
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
    orderBy: { conversation: { lastMessageAt: "desc" } },
    take: 100,
  });

  return parts.map((p) => {
    const otherP = p.conversation.participants.find((x) => x.userId !== userId);
    const last = p.conversation.messages[0];
    return {
      id: p.conversationId,
      other: {
        id: otherP?.userId ?? "",
        name: otherP?.user.name ?? otherP?.user.email ?? "Unknown",
      },
      lastMessage: last ? (last.body || (last.attachmentUrl ? "📎 Attachment" : "")) : "No messages yet",
      lastMessageAt: p.conversation.lastMessageAt,
      unread: !!last && (!p.lastReadAt || last.createdAt > p.lastReadAt) && last.senderId !== userId,
      muted: !!p.mutedUntil && p.mutedUntil > new Date(),
    };
  });
}

export async function unreadConversationCount(userId: string): Promise<number> {
  const rows = await listInbox(userId);
  return rows.filter((r) => r.unread).length;
}

/** Load a conversation the caller is in, mark it read, return messages + meta. */
export async function openConversation(userId: string, conversationId: string) {
  const me = await db.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
    include: {
      conversation: {
        include: { participants: { include: { user: { select: { id: true, name: true, email: true } } } } },
      },
    },
  });
  if (!me) throw new ApiError(404, "NOT_FOUND", "Conversation not found.");

  const messages = await db.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: 300,
    include: { sender: { select: { id: true, name: true } } },
  });

  await db.conversationParticipant.update({
    where: { conversationId_userId: { conversationId, userId } },
    data: { lastReadAt: new Date() },
  });

  const other = me.conversation.participants.find((p) => p.userId !== userId);
  return {
    conversationId,
    other: { id: other?.userId ?? "", name: other?.user.name ?? other?.user.email ?? "Unknown" },
    muted: !!me.mutedUntil && me.mutedUntil > new Date(),
    archived: !!me.archivedAt,
    messages: messages.map((m) => ({
      id: m.id,
      body: m.body,
      mine: m.senderId === userId,
      senderName: m.sender.name ?? "You",
      attachmentUrl: m.attachmentUrl,
      attachmentName: m.attachmentName,
      attachmentType: m.attachmentType,
      createdAt: m.createdAt.toISOString(),
    })),
  };
}

export async function messagesSince(userId: string, conversationId: string, sinceIso: string) {
  const inIt = await db.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!inIt) throw new ApiError(404, "NOT_FOUND", "Conversation not found.");
  const since = new Date(sinceIso);
  const rows = await db.message.findMany({
    where: { conversationId, createdAt: { gt: since } },
    orderBy: { createdAt: "asc" },
    include: { sender: { select: { name: true } } },
  });
  if (rows.length) {
    await db.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: new Date() },
    });
  }
  return rows.map((m) => ({
    id: m.id,
    body: m.body,
    mine: m.senderId === userId,
    senderName: m.sender.name ?? "",
    attachmentUrl: m.attachmentUrl,
    attachmentName: m.attachmentName,
    attachmentType: m.attachmentType,
    createdAt: m.createdAt.toISOString(),
  }));
}

export async function postMessage(
  userId: string,
  conversationId: string,
  body: string,
  attachment?: { url: string; name: string; type: string },
) {
  rateLimit(`msg:${userId}`, { windowSeconds: 60, max: 30 });
  const text = body.trim().slice(0, 5000);
  if (!text && !attachment) throw new ApiError(422, "EMPTY", "Write a message.");

  const me = await db.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
    include: { conversation: { include: { participants: true } } },
  });
  if (!me) throw new ApiError(404, "NOT_FOUND", "Conversation not found.");

  const message = await db.message.create({
    data: {
      conversationId,
      senderId: userId,
      body: text,
      attachmentUrl: attachment?.url ?? null,
      attachmentName: attachment?.name ?? null,
      attachmentType: attachment?.type ?? null,
    },
  });

  await db.conversation.update({ where: { id: conversationId }, data: { lastMessageAt: new Date() } });

  const now = new Date();
  for (const p of me.conversation.participants) {
    if (p.userId === userId) continue;
    // a new message un-archives the thread for the recipient
    if (p.archivedAt) {
      await db.conversationParticipant.update({ where: { id: p.id }, data: { archivedAt: null } });
    }
    const muted = p.mutedUntil && p.mutedUntil > now;
    if (!muted) {
      const sender = await db.user.findUnique({ where: { id: userId }, select: { name: true } });
      await db.notification.create({
        data: {
          userId: p.userId,
          type: "MESSAGE",
          title: `New message from ${sender?.name ?? "someone"}`,
          body: text ? text.slice(0, 140) : "Sent an attachment",
          linkUrl: `/dashboard/messages/${conversationId}`,
        },
      }).catch(() => {});
    }
  }

  return message;
}

export async function startConversation(
  fromId: string,
  toId: string,
  body: string,
  attachment?: { url: string; name: string; type: string },
) {
  await assertCanMessage(fromId, toId);
  const conv = await findOrCreateDirectConversation(fromId, toId);
  await postMessage(fromId, conv.id, body, attachment);
  return conv.id;
}

export async function setMuted(userId: string, conversationId: string, muted: boolean) {
  await db.conversationParticipant.update({
    where: { conversationId_userId: { conversationId, userId } },
    data: { mutedUntil: muted ? new Date("2099-01-01") : null },
  });
}

export async function setArchived(userId: string, conversationId: string, archived: boolean) {
  await db.conversationParticipant.update({
    where: { conversationId_userId: { conversationId, userId } },
    data: { archivedAt: archived ? new Date() : null },
  });
}

/** People the caller is allowed to start a conversation with, matching a query. */
export async function searchMessageable(userId: string, q: string) {
  const term = q.trim();
  if (term.length < 2) return [];
  const staff = await isStaff(userId);
  const rows = await db.user.findMany({
    where: {
      id: { not: userId },
      deletedAt: null,
      OR: [
        { name: { contains: term, mode: "insensitive" } },
        { email: { contains: term, mode: "insensitive" } },
      ],
      ...(staff
        ? {}
        : { roles: { some: { role: { key: { in: ["INSTRUCTOR", "ADMIN", "SUPER_ADMIN", "SUPPORT_MANAGER", "COURSE_MANAGER"] } } } } }),
    },
    select: { id: true, name: true, email: true },
    take: 8,
  });
  return rows.map((r) => ({ id: r.id, name: r.name ?? r.email, email: r.email }));
}
