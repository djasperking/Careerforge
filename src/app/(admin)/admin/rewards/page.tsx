import { requirePermissionPage } from "@/lib/session";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Gift } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { listSocialFollowClaims } from "@/lib/rewards/service";
import { RevokeClaimButton } from "./revoke-claim-button";

export const metadata = { title: "Reward claims" };

const PLATFORM_LABELS: Record<string, string> = {
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  TWITTER: "X (Twitter)",
  LINKEDIN: "LinkedIn",
};

export default async function AdminRewardsPage() {
  await requirePermissionPage("payments:read");
  const claims = await listSocialFollowClaims();

  return (
    <div>
      <PageHeader
        title="Reward claims"
        description="Every self-reported 'I've followed' claim. These are honor-system — not API-verified — so spot-check and revoke anything that looks off."
      />

      <Card>
        <CardContent className="p-0">
          {claims.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={Gift} title="No claims yet" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="p-3">User</th>
                    <th className="p-3">Platform</th>
                    <th className="p-3">Credited</th>
                    <th className="p-3">Claimed</th>
                    <th className="p-3">Current balance</th>
                    <th className="p-3" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {claims.map((c) => (
                    <tr key={c.id}>
                      <td className="p-3">
                        <p className="font-medium">{c.user.name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{c.user.email}</p>
                      </td>
                      <td className="p-3">{PLATFORM_LABELS[c.platform] ?? c.platform}</td>
                      <td className="p-3">{formatCurrency(c.creditedCents)}</td>
                      <td className="p-3 text-muted-foreground">{formatDate(c.claimedAt)}</td>
                      <td className="p-3 text-muted-foreground">{formatCurrency(c.user.creditCents)}</td>
                      <td className="p-3">
                        <RevokeClaimButton claimId={c.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
