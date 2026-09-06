import { requirePermissionPage } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { SettingsForm } from "./settings-form";

export const metadata = { title: "Settings" };

const KEYS = [
  "general.siteName",
  "general.contactEmail",
  "general.currency",
  "auth.registrationOpen",
  "auth.requireEmailVerification",
  "ads.enabled",
  "cv.oneTimePriceCents",
  "social.facebook",
  "social.instagram",
  "social.twitter",
  "social.linkedin",
] as const;

export default async function AdminSettingsPage() {
  await requirePermissionPage("settings:write");
  const rows = await db.systemSetting.findMany({ where: { key: { in: [...KEYS] } } });
  const values = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  return (
    <div>
      <PageHeader title="System settings" description="Global configuration. Stored in SystemSetting, not code." />
      <Card>
        <CardContent className="p-6">
          <SettingsForm
            initial={{
              siteName: String(values["general.siteName"] ?? "Career Forge"),
              contactEmail: String(values["general.contactEmail"] ?? ""),
              currency: String(values["general.currency"] ?? "NGN"),
              cvOneTimePrice: (typeof values["cv.oneTimePriceCents"] === "number" ? values["cv.oneTimePriceCents"] : 100_000) / 100,
              registrationOpen: values["auth.registrationOpen"] !== false,
              requireEmailVerification: values["auth.requireEmailVerification"] !== false,
              adsEnabled: values["ads.enabled"] !== false,
              facebookUrl: String(values["social.facebook"] ?? ""),
              instagramUrl: String(values["social.instagram"] ?? ""),
              twitterUrl: String(values["social.twitter"] ?? ""),
              linkedinUrl: String(values["social.linkedin"] ?? ""),
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
