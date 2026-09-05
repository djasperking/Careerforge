"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { setCampaignStatus } from "../actions";

const STATUS_VARIANT: Record<string, "success" | "secondary" | "warning"> = {
  ACTIVE: "success", DRAFT: "secondary", PAUSED: "warning", COMPLETED: "secondary", ARCHIVED: "secondary",
};

export function CampaignStatusControl({ campaignId, status }: { campaignId: string; status: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function setStatus(next: "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED" | "ARCHIVED") {
    start(async () => {
      await setCampaignStatus(campaignId, next);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>
      {pending ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : null}
      {status !== "ACTIVE" ? <Button size="sm" onClick={() => setStatus("ACTIVE")} disabled={pending}>Activate</Button> : null}
      {status === "ACTIVE" ? <Button size="sm" variant="outline" onClick={() => setStatus("PAUSED")} disabled={pending}>Pause</Button> : null}
      {status !== "ARCHIVED" ? <Button size="sm" variant="outline" onClick={() => setStatus("ARCHIVED")} disabled={pending}>Archive</Button> : null}
    </div>
  );
}
