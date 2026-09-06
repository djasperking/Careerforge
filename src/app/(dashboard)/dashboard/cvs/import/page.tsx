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
        description="Upload an existing CV (or paste it) and we'll read it into editable fields — free on every plan, no typing. Add a job advert to also have the AI reorder and reword your real experience for that role, with nothing invented."
      />
      <ImportCvForm />
    </div>
  );
}
