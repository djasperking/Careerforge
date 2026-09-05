import { notFound } from "next/navigation";
import { requirePermissionPage } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { CampaignStatusControl } from "./campaign-status-control";
import { AdManager } from "./ad-manager";

export default async function AdminCampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermissionPage("ads:write");
  const { id } = await params;

  const campaign = await db.adCampaign.findUnique({
    where: { id },
    include: {
      ads: {
        include: { _count: { select: { impressions: true, clicks: true } } },
        orderBy: { priority: "desc" },
      },
    },
  });
  if (!campaign) notFound();

  return (
    <div>
      <PageHeader
        title={campaign.name}
        description={campaign.advertiser}
        action={<CampaignStatusControl campaignId={campaign.id} status={campaign.status} />}
      />
      <AdManager
        campaignId={campaign.id}
        ads={campaign.ads.map((a) => ({
          id: a.id, title: a.title, description: a.description, imageUrl: a.imageUrl,
          destinationUrl: a.destinationUrl, placement: a.placement, priority: a.priority,
          maxImpressions: a.maxImpressions, maxClicks: a.maxClicks, status: a.status,
          impressions: a._count.impressions, clicks: a._count.clicks,
        }))}
      />
    </div>
  );
}
