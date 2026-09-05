import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermissionPage } from "@/lib/session";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { ADMIN_ROLES } from "@/lib/rbac";
import { TicketControls } from "./ticket-controls";
import { AdminReplyForm } from "./admin-reply-form";

export default async function AdminTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermissionPage("support:handle");
  const { id } = await params;

  const [ticket, admins] = await Promise.all([
    db.supportTicket.findUnique({
      where: { id },
      include: { user: true, messages: { orderBy: { createdAt: "asc" }, include: { author: true } } },
    }),
    db.user.findMany({
      where: { roles: { some: { role: { key: { in: [...ADMIN_ROLES] } } } } },
      select: { id: true, name: true, email: true },
    }),
  ]);
  if (!ticket) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/admin/support"><ArrowLeft className="size-4" /></Link>
        </Button>
        <div>
          <p className="text-xs text-muted-foreground">{ticket.category} · {ticket.user.email}</p>
          <h1 className="font-display text-xl font-semibold">{ticket.subject}</h1>
        </div>
      </div>

      <div className="mb-4">
        <TicketControls ticketId={ticket.id} status={ticket.status} assignedToId={ticket.assignedToId} admins={admins} />
      </div>

      <div className="space-y-3">
        {ticket.messages.map((m) => (
          <Card key={m.id} className={m.isInternalNote ? "border-warning/40 bg-warning/5" : m.authorId === ticket.userId ? "" : "bg-primary/5"}>
            <CardContent className="p-4">
              <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {m.author.name ?? m.author.email}
                  {m.isInternalNote ? <Badge variant="warning" className="ml-2">Internal note</Badge> : null}
                </span>
                <span>{formatDate(m.createdAt)}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm">{m.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <AdminReplyForm ticketId={ticket.id} />
    </div>
  );
}
