import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ProfileForm } from "./profile-form";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUser();
  const [dbUser, profile] = await Promise.all([
    db.user.findUnique({ where: { id: user.id } }),
    db.profile.findUnique({ where: { userId: user.id } }),
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
    </div>
  );
}
