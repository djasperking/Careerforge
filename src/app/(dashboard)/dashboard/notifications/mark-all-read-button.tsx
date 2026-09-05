"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markAllNotificationsRead } from "./actions";

export function MarkAllReadButton({ disabled }: { disabled: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <Button
      variant="outline" size="sm" disabled={disabled || pending}
      onClick={() => start(async () => { await markAllNotificationsRead(); router.refresh(); })}
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <CheckCheck className="size-4" />}
      Mark all read
    </Button>
  );
}
