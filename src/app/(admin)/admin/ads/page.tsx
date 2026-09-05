import Link from "next/link";
import { requirePermissionPage } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { NewCampaignControl } from "./new-campaign-control";

export const metadata = { title: "Advertisements" };

const STATUS_VARIANT: Record<string, "success" | "secondary" | "warning"> = {
  ACTIVE: "success", DRAFT: "secondary", PAUSED: "warning", COMPLETED: "secondary", ARCHIVED: "secondary",
};

export default async function AdminAdsPage() {
  await requirePermissionPage("ads:write");
  const campaigns = await db.adCampaign.findMany({
    include: { _count: { select: { ads: true } } },
    orderBy: { createdAt: "desc" },
  });

  const [totalImpressions, totalClicks] = await Promise.all([
    db.adImpression.count(),
    db.adClick.count(),
  ]);
  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : "0.0";

  return (
    <div>
      <PageHeader
        title="Advertising"
        description={`${totalImpressions} impressions · ${totalClicks} clicks · ${ctr}% CTR (all time)`}
        action={<NewCampaignControl />}
      />
      {campaigns.length === 0 ? (
        <EmptyState title="No campaigns yet" description="Create your first campaign to get started." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((c) => (
            <Link key={c.id} href={`/admin/ads/${c.id}`}>
              <Card className="h-full transition-colors hover:border-primary/40">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{c.name}</p>
                    <Badge variant={STATUS_VARIANT[c.status]}>{c.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{c.advertiser} · {c._count.ads} ad(s)</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
