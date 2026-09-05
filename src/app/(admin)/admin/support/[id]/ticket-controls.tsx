"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { setTicketStatusAdmin, assignTicket } from "../actions";

const STATUSES = ["OPEN", "PENDING", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;

export function TicketControls({
  ticketId, status, assignedToId, admins,
}: {
  ticketId: string;
  status: string;
  assignedToId: string | null;
  admins: { id: string; name: string | null; email: string }[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      {pending ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : null}
      <select
        value={status}
        disabled={pending}
        onChange={(e) => start(async () => { await setTicketStatusAdmin(ticketId, e.target.value as typeof STATUSES[number]); router.refresh(); })}
        className="h-9 rounded-md border border-input bg-card px-2 text-sm"
      >
        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <select
        value={assignedToId ?? ""}
        disabled={pending}
        onChange={(e) => start(async () => { await assignTicket(ticketId, e.target.value || null); router.refresh(); })}
        className="h-9 rounded-md border border-input bg-card px-2 text-sm"
      >
        <option value="">Unassigned</option>
        {admins.map((a) => <option key={a.id} value={a.id}>{a.name ?? a.email}</option>)}
      </select>
    </div>
  );
}
