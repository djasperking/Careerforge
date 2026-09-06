import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getInstructorProfile } from "@/lib/instructor/service";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { OfferForm } from "../offer-form";

export const metadata = { title: "New coaching offer" };

export default async function NewOfferPage() {
  const user = await requireUser();
  const profile = await getInstructorProfile(user.id);
  if (!profile || profile.status !== "APPROVED") redirect("/instructor");

  return (
    <div>
      <PageHeader title="New coaching offer" description="Describe a session buyers can book and pay for." />
      <Card>
        <CardContent className="p-6">
          <OfferForm />
        </CardContent>
      </Card>
    </div>
  );
}
