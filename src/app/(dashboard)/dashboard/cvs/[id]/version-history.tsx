"use client";

import { useState, useTransition } from "react";
import { History, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { restoreCvVersion } from "../actions";
import { formatDate } from "@/lib/utils";

export function VersionHistory({
  cvId, versions,
}: {
  cvId: string;
  versions: { version: number; reason: string | null; createdAt: string }[];
}) {
  const [pending, start] = useTransition();
  const [restoring, setRestoring] = useState<number | null>(null);

  if (versions.length === 0) return null;

  function restore(version: number) {
    setRestoring(version);
    start(async () => {
      const res = await restoreCvVersion(cvId, version);
      setRestoring(null);
      if (res.ok) window.location.reload();
    });
  }

  return (
    <Card className="mt-6">
      <CardContent className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <History className="size-4 text-muted-foreground" />
          <h3 className="font-display text-base font-semibold">Version history</h3>
        </div>
        <ul className="divide-y">
          {versions.map((v) => (
            <li key={v.version} className="flex items-center justify-between py-2 text-sm">
              <div>
                <span className="font-medium">v{v.version}</span>{" "}
                <span className="text-muted-foreground">
                  {v.reason ?? "manual save"} · {formatDate(v.createdAt)}
                </span>
              </div>
              <Button size="sm" variant="outline" disabled={pending} onClick={() => restore(v.version)}>
                {restoring === v.version ? <Loader2 className="size-4 animate-spin" /> : "Restore"}
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
