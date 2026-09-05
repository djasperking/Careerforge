import Link from "next/link";
import { LifeBuoy, Plus } from "lucide-react";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Support" };

const STATUS_VARIANT: Record<string, "success" | "secondary" | "warning"> = {
  OPEN: "warning", PENDING: "secondary", IN_PROGRESS: "secondary", RESOLVED: "success", CLOSED: "secondary",
};

export default async function SupportPage() {
  const user = await requireUser();
  const tickets = await db.supportTicket.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Support"
        description="Get help from the Career Forge team."
        action={
          <Button asChild>
            <Link href="/dashboard/support/new"><Plus className="size-4" /> New ticket</Link>
          </Button>
        }
      />
      {tickets.length === 0 ? (
        <EmptyState icon={LifeBuoy} title="No support tickets yet" description="Open a ticket if you need help." />
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <Link key={t.id} href={`/dashboard/support/${t.id}`}>
              <Card className="transition-colors hover:border-primary/40">
                <CardContent className="flex items-center justify-between p-5">
                  <div>
                    <p className="font-medium">{t.subject}</p>
                    <p className="text-sm text-muted-foreground">{t.category} · Updated {formatDate(t.updatedAt)}</p>
                  </div>
                  <Badge variant={STATUS_VARIANT[t.status]}>{t.status}</Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
