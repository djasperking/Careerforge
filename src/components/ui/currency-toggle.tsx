"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setCurrencyAction } from "@/lib/currency-actions";
import type { BuyerCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

/** Small "Pay in $ instead" / "Pay in ₦ instead" link — always available next
 * to a price, since country-based currency detection is a guess. */
export function CurrencyToggle({ current, className = "" }: { current: BuyerCurrency; className?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const other: BuyerCurrency = current === "USD" ? "NGN" : "USD";
  const label = other === "USD" ? "Pay in $ instead" : "Pay in ₦ instead";

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await setCurrencyAction(other);
          router.refresh();
        })
      }
      className={cn("text-xs text-muted-foreground underline-offset-2 hover:text-primary hover:underline disabled:opacity-50", className)}
    >
      {pending ? "Switching…" : label}
    </button>
  );
}
