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
      </div>

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
