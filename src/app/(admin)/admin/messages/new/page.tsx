import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/ui/page-header";
import { NewMessageForm } from "@/app/(dashboard)/dashboard/messages/new-message-form";

export const metadata = { title: "New message" };

export default async function AdminNewMessagePage() {
  await requireUser();
  return (
    <div className="max-w-xl">
      <Link href="/admin/messages" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Messages
      </Link>
      <PageHeader title="New message" description="Message an instructor, seller or another staff member." />
      <NewMessageForm basePath="/admin/messages" />
    </div>
  );
}
