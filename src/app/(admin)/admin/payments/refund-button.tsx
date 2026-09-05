"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { issueRefund } from "./actions";

export function RefundButton({ transactionId }: { transactionId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <Button
      size="sm"
      variant="outline"
      className="text-destructive hover:text-destructive"
      disabled={pending}
      onClick={() => {
        if (!confirm("Refund this transaction? This cancels the associated enrollment or subscription.")) return;
        start(async () => {
          const res = await issueRefund(transactionId);
          if (!res.ok) alert(res.error);
          router.refresh();
        });
      }}
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : "Refund"}
    </Button>
  );
}
