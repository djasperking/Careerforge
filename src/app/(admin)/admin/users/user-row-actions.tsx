"use client";

import { useState, useTransition } from "react";
import { setUserStatus } from "./actions";
import { Button } from "@/components/ui/button";

export function UserRowActions({
  userId,
  status,
  canManage,
}: {
  userId: string;
  status: string;
  canManage: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!canManage) return null;

  function run(next: "ACTIVE" | "SUSPENDED") {
    setError(null);
    start(async () => {
      const res = await setUserStatus(userId, next);
      if (!res.ok) setError(res.error ?? "Action failed");
    });
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
      {status === "SUSPENDED" || status === "BANNED" ? (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => run("ACTIVE")}>
          Restore
        </Button>
      ) : (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => run("SUSPENDED")}>
          Suspend
        </Button>
      )}
    </div>
  );
}
