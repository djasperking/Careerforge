import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { renderMarkdown } from "@/lib/markdown";
import { LEGAL_DOCS, getLegalDoc } from "@/lib/legal/content";

export function generateStaticParams() {
  return LEGAL_DOCS.map((d) => ({ doc: d.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ doc: string }> }) {
  const { doc } = await params;
  const d = getLegalDoc(doc);
  return d ? { title: d.title, description: d.description } : { title: "Legal" };
}

export default async function LegalPage({ params }: { params: Promise<{ doc: string }> }) {
  const { doc } = await params;
  const [d, user] = await Promise.all([getLegalDoc(doc), getCurrentUser()]);
  if (!d) notFound();

  return (
    <div className="min-h-screen">
      <MarketingHeader loggedIn={Boolean(user)} />
      <main className="container max-w-2xl py-12">
        <h1 className="font-display text-3xl font-bold tracking-tight">{d.title}</h1>
        <nav className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {LEGAL_DOCS.map((x) => (
            <Link
              key={x.slug}
              href={`/legal/${x.slug}`}
              className={x.slug === d.slug ? "font-medium text-primary" : "text-muted-foreground hover:text-foreground"}
            >
              {x.title}
            </Link>
          ))}
        </nav>
        <article
          className="prose prose-neutral mt-8 max-w-none dark:prose-invert prose-headings:font-display prose-h2:text-xl prose-h2:mt-8"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(d.body) }}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
