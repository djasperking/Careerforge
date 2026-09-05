"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { markNotificationRead } from "./actions";

export function NotificationRow({
  id, title, body, linkUrl, createdAt, read,
}: {
  id: string;
  title: string;
  body: string;
  linkUrl: string | null;
  createdAt: string;
  read: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const content = (
    <>
      <div className="flex items-center justify-between">
        <p className="font-medium">{title}</p>
        <span className="text-xs text-muted-foreground">{formatDate(createdAt)}</span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </>
  );

  return (
    <Card className={read ? "opacity-70" : ""}>
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="flex-1">
          {linkUrl ? (
            <Link href={linkUrl} onClick={() => !read && start(() => markNotificationRead(id))}>
              {content}
            </Link>
          ) : content}
        </div>
        {!read ? (
          <Button
            size="sm" variant="ghost" disabled={pending}
            onClick={() => start(async () => { await markNotificationRead(id); router.refresh(); })}
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : "Mark read"}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
