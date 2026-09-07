import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/session";
import { openConversation } from "@/lib/messaging/service";
import { ConversationView } from "../conversation-view";

export const metadata = { title: "Conversation" };

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  let data;
  try {
    data = await openConversation(user.id, id);
  } catch {
    notFound();
  }

  return (
    <div>
      <Link href="/dashboard/messages" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Messages
      </Link>
      <ConversationView
        conversationId={data.conversationId}
        otherName={data.other.name}
        initialMessages={data.messages}
        muted={data.muted}
        archived={data.archived}
      />
    </div>
  );
}
