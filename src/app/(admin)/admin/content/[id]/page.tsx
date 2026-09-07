import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermissionPage } from "@/lib/session";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/email";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PostForm } from "../post-form";
import { PostStatusControls } from "../post-status";

export const metadata = { title: "Edit post" };

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermissionPage("content:write");
  const { id } = await params;
  const post = await db.blogPost.findUnique({ where: { id } });
  if (!post) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={post.title} description={`/blog/${post.slug}`} />
      <p className="text-sm"><Link href="/admin/content" className="text-primary hover:underline">← All posts</Link></p>

      <Card>
        <CardHeader><CardTitle>Status</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Badge>{post.status}</Badge>
            {post.status === "PUBLISHED" ? (
              <a href={appUrl(`/blog/${post.slug}`)} target="_blank" rel="noreferrer" className="text-primary hover:underline">View ↗</a>
            ) : null}
          </div>
          <PostStatusControls postId={post.id} status={post.status} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Content</CardTitle></CardHeader>
        <CardContent>
          <PostForm
            postId={post.id}
            initial={{
              title: post.title,
              excerpt: post.excerpt ?? "",
              category: post.categoryId ?? "",
              coverUrl: post.coverUrl ?? "",
              body: post.body,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
