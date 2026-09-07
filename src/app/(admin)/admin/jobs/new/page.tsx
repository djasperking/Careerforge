import Link from "next/link";
import { requirePermissionPage } from "@/lib/session";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { JobForm } from "../job-form";

export const metadata = { title: "New job" };

export default async function NewJobPage() {
  await requirePermissionPage("jobs:write");
  return (
    <div className="space-y-6">
      <PageHeader title="New job" description="It's saved as a draft — publish it when you're ready." />
      <p className="text-sm"><Link href="/admin/jobs" className="text-primary hover:underline">← All jobs</Link></p>
      <Card><CardContent className="p-6"><JobForm /></CardContent></Card>
    </div>
  );
}
