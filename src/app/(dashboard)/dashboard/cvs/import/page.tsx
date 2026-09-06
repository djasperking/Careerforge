import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/ui/page-header";
import { ImportCvForm } from "./import-form";

export const metadata = { title: "Import & tailor a CV" };

export default async function ImportCvPage() {
  await requireUser();
  return (
    <div className="max-w-2xl">
      <Link
        href="/dashboard/cvs"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to my CVs
      </Link>
      <PageHeader
        title="Import & tailor a CV"
        description="Upload an existing CV (or paste it), optionally add a job advert, and we'll turn it into an editable Career Forge CV — reordered and reworded for that role, with nothing invented."
      />
      <ImportCvForm />
    </div>
  );
}
