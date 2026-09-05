import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { ReplyForm } from "./reply-form";

const STATUS_VARIANT: Record<string, "success" | "secondary" | "warning"> = {
  OPEN: "warning", PENDING: "secondary", IN_PROGRESS: "secondary", RESOLVED: "success", CLOSED: "secondary",
};

export default async function SupportTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const ticket = await db.supportTicket.findFirst({
    where: { id, userId: user.id },
    include: {
      messages: { where: { isInternalNote: false }, orderBy: { createdAt: "asc" }, include: { author: true } },
    },
  });
  if (!ticket) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/support"><ArrowLeft className="size-4" /></Link>
        </Button>
        <div>
          <p className="text-xs text-muted-foreground">{ticket.category}</p>
          <h1 className="font-display text-xl font-semibold">{ticket.subject}</h1>
        </div>
        <Badge variant={STATUS_VARIANT[ticket.status]} className="ml-auto">{ticket.status}</Badge>
      </div>

      <div className="space-y-3">
        {ticket.messages.map((m) => (
          <Card key={m.id} className={m.authorId === user.id ? "bg-primary/5" : ""}>
            <CardContent className="p-4">
              <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>{m.authorId === user.id ? "You" : m.author.name ?? "Support"}</span>
                <span>{formatDate(m.createdAt)}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm">{m.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {ticket.status !== "CLOSED" ? <ReplyForm ticketId={ticket.id} /> : (
        <p className="mt-4 text-sm text-muted-foreground">This ticket is closed.</p>
      )}
    </div>
  );
}
