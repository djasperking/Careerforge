import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SharePanel } from "@/components/ui/share-panel";
import { formatCurrency, formatDate } from "@/lib/utils";
import { appUrl } from "@/lib/email";
import { ensureReferralCode, referralSummary, referralRewardConfig, referralSignupBonusConfig } from "@/lib/referral/service";

export const metadata = { title: "Refer & earn" };

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold">{value}</p>
    </div>
  );
}

export default async function ReferralsPage() {
  const user = await requireUser();
  const [code, summary, reward, signupBonus] = await Promise.all([
    ensureReferralCode(user.id),
    referralSummary(user.id),
    referralRewardConfig(),
    referralSignupBonusConfig(),
  ]);
  const link = appUrl(`/r/${code}`);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Refer & earn"
        description={`Share your link. They get ${formatCurrency(signupBonus)} in credit just for signing up, and when they make their first purchase you get ${formatCurrency(reward)} — both used automatically at checkout.`}
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Available credit" value={formatCurrency(summary.creditCents)} />
        <Stat label="People referred" value={String(summary.referredCount)} />
        <Stat label="Made a purchase" value={String(summary.convertedCount)} />
        <Stat label="Total earned" value={formatCurrency(summary.earnedCents)} />
      </div>

      <Card>
        <CardHeader><CardTitle>Your referral link</CardTitle></CardHeader>
        <CardContent>
          <SharePanel
            url={link}
            intro="Send this to friends. They sign up through it, and you earn when they first buy something."
            shareText="Learn a skill and land remote work with Career Forge —"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Rewards</CardTitle></CardHeader>
        <CardContent>
          {summary.rewards.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No rewards yet. They appear here when someone you referred makes their first purchase.
            </p>
          ) : (
            <ul className="divide-y text-sm">
              {summary.rewards.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-2.5">
                  <span>{r.referredUser.name ?? "A referred user"}</span>
                  <span className="text-muted-foreground">
                    +{formatCurrency(r.amountCents, r.currency)} · {formatDate(r.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
