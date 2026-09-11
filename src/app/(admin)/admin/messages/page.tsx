import Link from "next/link";
import { MessageSquarePlus, BellOff, MessageSquare } from "lucide-react";
import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { listInbox } from "@/lib/messaging/service";

// Same inbox as /dashboard/messages, rendered under the admin shell so
// staff clicking "Messages" from the admin sidebar don't get bounced into
// the customer nav — see src/app/(dashboard)/dashboard/messages/page.tsx
// for the customer-facing copy (kept separate because their internal links
// point at different base paths).
export const metadata = { title: "Messages" };

function ago(d: Date) {
  const s = (Date.now() - d.getTime()) / 1000;
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 604800) return `${Math.floor(s / 86400)}d`;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export default async function AdminMessagesPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const user = await requireUser();
  const view = (await searchParams).view === "archived" ? "archived" : "inbox";
  const rows = await listInbox(user.id, { archived: view === "archived" });

  return (
    <div>
      <PageHeader
        title="Messages"
        description="Direct messages with instructors, sellers and other staff."
        action={
          <Button asChild>
            <Link href="/admin/messages/new"><MessageSquarePlus className="size-4" /> New message</Link>
          </Button>
        }
      />

      <div className="mb-4 flex gap-2 text-sm">
        <Link href="/admin/messages" className={cn("rounded-md px-3 py-1.5 font-medium", view === "inbox" ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>
          Inbox
        </Link>
        <Link href="/admin/messages?view=archived" className={cn("rounded-md px-3 py-1.5 font-medium", view === "archived" ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>
          Archived
        </Link>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title={view === "archived" ? "Nothing archived" : "No conversations yet"}
          description={view === "archived" ? "Archived chats show up here." : "Start one with an instructor, seller or another staff member."}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y">
              {rows.map((r) => (
                <li key={r.id}>
                  <Link href={`/admin/messages/${r.id}`} className="flex items-center gap-3 p-4 hover:bg-muted/40">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 font-medium text-primary">
                      {r.other.name.slice(0, 1).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className={cn("truncate", r.unread ? "font-semibold" : "font-medium")}>{r.other.name}</p>
                        {r.muted ? <BellOff className="size-3 text-muted-foreground" /> : null}
                        <span className="ml-auto shrink-0 text-xs text-muted-foreground">{ago(r.lastMessageAt)}</span>
                      </div>
                      <p className={cn("truncate text-sm", r.unread ? "text-foreground" : "text-muted-foreground")}>{r.lastMessage}</p>
                    </div>
                    {r.unread ? <span className="size-2 shrink-0 rounded-full bg-primary" /> : null}
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
