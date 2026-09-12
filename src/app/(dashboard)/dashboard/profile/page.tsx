import Link from "next/link";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { socialRewardsStatus } from "@/lib/rewards/service";
import { ProfileForm } from "./profile-form";
import { JobAlertsToggle } from "./job-alerts-toggle";
import { SocialRewards } from "./social-rewards";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUser();
  const [dbUser, profile, rewards] = await Promise.all([
    db.user.findUnique({ where: { id: user.id } }),
    db.profile.findUnique({ where: { userId: user.id } }),
    socialRewardsStatus(user.id),
  ]);

  return (
    <div>
      <PageHeader
        title="Profile"
        description={`Your profile is ${profile?.completionPercent ?? 0}% complete.`}
      />
      <Card>
        <CardContent className="p-6">
          <ProfileForm
            initial={{
              name: dbUser?.name ?? "",
              image: dbUser?.image ?? "",
              headline: profile?.headline ?? "",
              bio: profile?.bio ?? "",
              phone: profile?.phone ?? "",
              location: profile?.location ?? "",
              skills: (profile?.skills ?? []).join(", "),
              careerInterests: (profile?.careerInterests ?? []).join(", "),
              languages: (profile?.languages ?? []).join(", "),
              isPublic: profile?.isPublic ?? false,
            }}
          />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Account credit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-primary/5 p-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Available credit</p>
              <p className="font-display text-2xl font-semibold">{formatCurrency(dbUser?.creditCents ?? 0)}</p>
            </div>
            <p className="max-w-xs text-xs text-muted-foreground">
              Used automatically at checkout on courses and premium CV unlocks — it can&apos;t be spent on
              digital products, coaching, or subscriptions.
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-medium">Follow us, earn credit</h3>
            <SocialRewards platforms={rewards.platforms} rewardCents={rewards.rewardCents} />
          </div>

          <p className="text-sm text-muted-foreground">
            You also earn credit by{" "}
            <Link href="/dashboard/referrals" className="text-primary hover:underline">
              referring friends
            </Link>{" "}
            — both of you get credit: they get a welcome bonus when they sign up, and you earn a reward
            when they make their first purchase.
          </p>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardContent className="p-6">
          <h2 className="mb-4 font-display text-base font-semibold">Email preferences</h2>
          <JobAlertsToggle initialEnabled={!dbUser?.jobAlertsOptOut} />
        </CardContent>
      </Card>
    </div>
  );
}
