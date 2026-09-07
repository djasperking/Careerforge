import Link from "next/link";
import { requirePermissionPage } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Blog" };

const BADGE: Record<string, { label: string; variant: "secondary" | "success" | "destructive" }> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  PUBLISHED: { label: "Live", variant: "success" },
  UNPUBLISHED: { label: "Unpublished", variant: "secondary" },
  ARCHIVED: { label: "Archived", variant: "destructive" },
};

export default async function AdminContentPage() {
  await requirePermissionPage("content:write");
  const posts = await db.blogPost.findMany({ orderBy: [{ status: "asc" }, { updatedAt: "desc" }] });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blog & resources"
        description="Career articles, guides and platform updates. Published posts appear at /blog."
        action={<Button asChild><Link href="/admin/content/new">New post</Link></Button>}
      />
      <Card>
        <CardContent className="p-0">
          {posts.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No posts yet. <Link href="/admin/content/new" className="text-primary hover:underline">Write the first one.</Link>
            </p>
          ) : (
            <ul className="divide-y">
              {posts.map((p) => {
                const b = BADGE[p.status] ?? BADGE.DRAFT;
                return (
                  <li key={p.id} className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <Link href={`/admin/content/${p.id}`} className="font-medium hover:underline">{p.title}</Link>
                      <p className="text-xs text-muted-foreground">
                        {p.categoryId ? `${p.categoryId} · ` : ""}updated {formatDate(p.updatedAt)}
                      </p>
                    </div>
                    <Badge variant={b.variant}>{b.label}</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
