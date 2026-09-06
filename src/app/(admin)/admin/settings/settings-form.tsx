"use client";

import { useActionState } from "react";
import { saveSettings, type SettingsState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function SettingsForm({
  initial,
}: {
  initial: {
    siteName: string;
    contactEmail: string;
    currency: string;
    cvOneTimePrice: number;
    registrationOpen: boolean;
    requireEmailVerification: boolean;
    adsEnabled: boolean;
    payoutHoldDays: number;
    payoutMinimumNaira: number;
    facebookUrl: string;
    instagramUrl: string;
    twitterUrl: string;
    linkedinUrl: string;
  };
}) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(saveSettings, {});

  return (
    <form action={action} className="space-y-5">
      {state.ok ? <Alert variant="success"><AlertDescription>Settings saved.</AlertDescription></Alert> : null}
      {state.error ? <Alert variant="destructive"><AlertDescription>{state.error}</AlertDescription></Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="siteName">Site name</Label>
          <Input id="siteName" name="siteName" defaultValue={initial.siteName} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactEmail">Contact email</Label>
          <Input id="contactEmail" name="contactEmail" type="email" defaultValue={initial.contactEmail} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">Default currency (ISO 4217)</Label>
          <Input id="currency" name="currency" defaultValue={initial.currency} maxLength={3} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cvOneTimePrice">One-time CV unlock price (₦)</Label>
          <Input id="cvOneTimePrice" name="cvOneTimePrice" type="number" min={0} step="0.01" defaultValue={initial.cvOneTimePrice} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="payoutHoldDays">Payout hold (days)</Label>
          <Input id="payoutHoldDays" name="payoutHoldDays" type="number" min={0} max={90} defaultValue={initial.payoutHoldDays} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="payoutMinimumNaira">Minimum payout (₦)</Label>
          <Input id="payoutMinimumNaira" name="payoutMinimumNaira" type="number" min={0} step="0.01" defaultValue={initial.payoutMinimumNaira} required />
        </div>
      </div>

      <fieldset className="space-y-4">
        <legend className="text-sm font-medium">Social links</legend>
        <p className="text-xs text-muted-foreground">Full URLs. Shown in the site footer; blank hides the icon.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="facebookUrl">Facebook</Label>
            <Input id="facebookUrl" name="facebookUrl" type="url" placeholder="https://facebook.com/…" defaultValue={initial.facebookUrl} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instagramUrl">Instagram</Label>
            <Input id="instagramUrl" name="instagramUrl" type="url" placeholder="https://instagram.com/…" defaultValue={initial.instagramUrl} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="twitterUrl">X (Twitter)</Label>
            <Input id="twitterUrl" name="twitterUrl" type="url" placeholder="https://x.com/…" defaultValue={initial.twitterUrl} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="linkedinUrl">LinkedIn</Label>
            <Input id="linkedinUrl" name="linkedinUrl" type="url" placeholder="https://linkedin.com/company/…" defaultValue={initial.linkedinUrl} />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Toggles</legend>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="registrationOpen" defaultChecked={initial.registrationOpen} className="size-4" />
          Registration open
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="requireEmailVerification" defaultChecked={initial.requireEmailVerification} className="size-4" />
          Require email verification
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="adsEnabled" defaultChecked={initial.adsEnabled} className="size-4" />
          Advertising enabled
        </label>
      </fieldset>

      <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save settings"}</Button>
    </form>
  );
}
