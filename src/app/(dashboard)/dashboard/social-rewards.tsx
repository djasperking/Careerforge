"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Facebook, Instagram, Linkedin, Twitter, CheckCircle2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { claimSocialFollowAction } from "./rewards-actions";

const ICONS: Record<string, typeof Facebook> = {
  FACEBOOK: Facebook,
  INSTAGRAM: Instagram,
  TWITTER: Twitter,
  LINKEDIN: Linkedin,
};

export type SocialRewardPlatform = {
  platform: string;
  label: string;
  url: string;
  claimed: boolean;
};

export function SocialRewards({
  platforms,
  rewardCents,
}: {
  platforms: SocialRewardPlatform[];
  rewardCents: number;
}) {
  const router = useRouter();
  const [opened, setOpened] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function claim(platform: string) {
    setBusy(platform);
    setError(null);
    const res = await claimSocialFollowAction(platform);
    setBusy(null);
    if (!res.ok) setError(res.error);
    else router.refresh();
  }

  if (platforms.length === 0) {
    return <p className="text-sm text-muted-foreground">No social pages are set up yet.</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Follow a page, then come back and claim your credit — this is on the honor system (we can&apos;t
        verify follows through these platforms), so it&apos;s one claim per page.
      </p>
      <ul className="space-y-2">
        {platforms.map((p) => {
          const Icon = ICONS[p.platform] ?? Facebook;
          return (
            <li key={p.platform} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Icon className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium">{p.label}</span>
                <span className="text-xs text-muted-foreground">+{formatCurrency(rewardCents)}</span>
              </div>
              {p.claimed ? (
                <span className="flex items-center gap-1.5 text-sm text-primary">
                  <CheckCircle2 className="size-4" /> Claimed
                </span>
              ) : opened[p.platform] ? (
                <Button size="sm" disabled={busy === p.platform} onClick={() => claim(p.platform)}>
                  {busy === p.platform ? "Claiming…" : "I've followed — claim credit"}
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  asChild
                  onClick={() => setOpened((s) => ({ ...s, [p.platform]: true }))}
                >
                  <a href={p.url} target="_blank" rel="noopener noreferrer">
                    Follow on {p.label} <ExternalLink className="size-3.5" />
                  </a>
                </Button>
              )}
            </li>
          );
        })}
      </ul>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
