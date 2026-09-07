import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FileText } from "lucide-react";
import { formatDate, cn } from "@/lib/utils";
import { listPublishedPosts, listBlogCategories, authorNames } from "@/lib/blog/service";
import { SubscribeForm } from "@/components/newsletter/subscribe-form";

export const metadata = {
  title: "Blog",
  description: "Career guides, how-tos and updates from Career Forge.",
};

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const sp = await searchParams;
  const [user, posts, categories] = await Promise.all([
    getCurrentUser(),
    listPublishedPosts({ category: sp.category }),
    listBlogCategories(),
  ]);
  const authors = await authorNames(posts.map((p) => p.authorId));

  return (
    <div className="min-h-screen">
      <MarketingHeader loggedIn={Boolean(user)} />
      <main className="container max-w-4xl py-10">
        <h1 className="font-display text-3xl font-semibold">Blog & resources</h1>
        <p className="mt-1 text-muted-foreground">Career guides, annotation how-tos and platform updates.</p>

        <div className="mt-5 rounded-lg border bg-card p-4">
          <p className="text-sm font-medium">Get new posts + jobs by email, weekly</p>
          <div className="mt-2 max-w-sm"><SubscribeForm source="blog" compact /></div>
        </div>

        {categories.length > 0 ? (
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/blog" className={cn("rounded-full border px-3 py-1 text-xs", !sp.category && "border-primary bg-primary text-primary-foreground")}>All</Link>
            {categories.map((c) => (
              <Link
                key={c}
                href={`/blog?category=${encodeURIComponent(c)}`}
                className={cn("rounded-full border px-3 py-1 text-xs", sp.category === c && "border-primary bg-primary text-primary-foreground")}
              >
                {c}
              </Link>
            ))}
          </div>
        ) : null}

        {posts.length === 0 ? (
          <EmptyState icon={FileText} title="No posts yet" description="Check back soon." />
        ) : (
          <div className="mt-6 space-y-4">
            {posts.map((p) => (
              <Link key={p.id} href={`/blog/${p.slug}`}>
                <Card className="transition-colors hover:border-primary/40">
                  <CardContent className="p-5">
                    {p.categoryId ? <p className="text-xs font-medium uppercase tracking-wide text-primary">{p.categoryId}</p> : null}
                    <h2 className="mt-1 font-display text-xl font-semibold">{p.title}</h2>
                    {p.excerpt ? <p className="mt-1 text-sm text-muted-foreground">{p.excerpt}</p> : null}
                    <p className="mt-2 text-xs text-muted-foreground">
                      {authors.get(p.authorId ?? "") ?? "Career Forge"} · {formatDate(p.publishedAt ?? p.createdAt)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
