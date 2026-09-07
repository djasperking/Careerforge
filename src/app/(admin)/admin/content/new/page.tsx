import Link from "next/link";
import { requirePermissionPage } from "@/lib/session";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { PostForm } from "../post-form";

export const metadata = { title: "New post" };

export default async function NewPostPage() {
  await requirePermissionPage("content:write");
  return (
    <div className="space-y-6">
      <PageHeader title="New post" description="Saved as a draft until you publish it." />
      <p className="text-sm"><Link href="/admin/content" className="text-primary hover:underline">← All posts</Link></p>
      <Card><CardContent className="p-6"><PostForm /></CardContent></Card>
    </div>
  );
}
