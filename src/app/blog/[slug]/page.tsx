import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { formatDate } from "@/lib/utils";
import { renderMarkdown } from "@/lib/markdown";
import { getPublishedPost, authorNames } from "@/lib/blog/service";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  return post
    ? { title: post.title, description: post.excerpt ?? undefined }
    : { title: "Post" };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [post, user] = await Promise.all([getPublishedPost(slug), getCurrentUser()]);
  if (!post) notFound();
  const authors = await authorNames([post.authorId]);

  return (
    <div className="min-h-screen">
      <MarketingHeader loggedIn={Boolean(user)} />
      <main className="container max-w-2xl py-10">
        <Link href="/blog" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> All posts
        </Link>

        {post.categoryId ? <p className="text-xs font-medium uppercase tracking-wide text-primary">{post.categoryId}</p> : null}
        <h1 className="mt-1 font-display text-3xl font-semibold">{post.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {authors.get(post.authorId ?? "") ?? "Career Forge"} · {formatDate(post.publishedAt ?? post.createdAt)}
        </p>

        {post.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.coverUrl} alt="" className="mt-6 w-full rounded-lg border object-cover" />
        ) : null}

        <article
          className="prose prose-neutral mt-8 max-w-none dark:prose-invert prose-headings:font-display"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body) }}
        />

        <div className="mt-12 rounded-lg border bg-card p-5 text-sm">
          <p className="font-medium">Ready to start?</p>
          <p className="mt-1 text-muted-foreground">Build a CV, take a course, or browse jobs on Career Forge.</p>
          <Link href={user ? "/dashboard" : "/register"} className="mt-2 inline-block font-medium text-primary hover:underline">
            {user ? "Go to your dashboard" : "Create a free account"} →
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
