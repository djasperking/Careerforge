import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { NewCvChooser } from "./new-cv-chooser";

export const metadata = { title: "New CV" };

export default async function NewCvPage() {
  await requireUser();
  const templates = await db.cVTemplate.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, isPremium: true },
  });

  return (
    <div className="max-w-2xl">
      <Link
        href="/dashboard/cvs"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to my CVs
      </Link>
      <PageHeader
        title="New CV"
        description="Upload a CV you already have and we'll read it into editable fields — no typing. Or start from a blank template."
      />
      <NewCvChooser templates={templates} />
    </div>
  );
}
