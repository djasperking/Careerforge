import Link from "next/link";
import {
  ArrowRight, FileText, GraduationCap, ShieldCheck, Sparkles, BadgeCheck, BarChart3,
} from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { SocialLinks } from "@/components/layout/social-links";
import { SubscribeForm } from "@/components/newsletter/subscribe-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AdSlot } from "@/components/ads/ad-slot";
import { getCurrentUser } from "@/lib/session";
import { cvUnlockPrice } from "@/lib/cv/service";
import { getSocialLinks } from "@/lib/site";
import { listPublicJobs } from "@/lib/jobs/service";
import { listPublishedPosts } from "@/lib/blog/service";
import { formatCurrency, formatDate } from "@/lib/utils";

const features = [
  { icon: Sparkles, title: "AI CV Builder", body: "Draft, analyse and tailor your CV to any job with an ATS match score." },
  { icon: GraduationCap, title: "Online Courses", body: "Video lessons, resources and progress tracking, validated server-side." },
  { icon: BadgeCheck, title: "Exams & Certificates", body: "Secure timed exams, auto-grading and publicly verifiable certificates." },
  { icon: ShieldCheck, title: "Secure Payments", body: "Paystack checkout with server-verified transactions and receipts." },
  { icon: BarChart3, title: "Career Guidance", body: "An AI assistant for planning, interviews, cover letters and skill gaps." },
  { icon: FileText, title: "Professional Templates", body: "A growing library of ATS-friendly, print-ready CV designs." },
];

export default async function HomePage() {
  const [user, price, social, latestJobs, latestPosts] = await Promise.all([
    getCurrentUser(),
    cvUnlockPrice(),
    getSocialLinks(),
    listPublicJobs().then((j) => j.slice(0, 6)),
    listPublishedPosts({ take: 3 }),
  ]);
  const cvPriceLabel = formatCurrency(price.amountCents, price.currency);

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader loggedIn={Boolean(user)} />

      <main className="flex-1">
        <section className="container py-20 text-center">
          <p className="mb-4 text-sm font-medium uppercase tracking-widest text-primary">
            Build Your Career. Forge Your Future.
          </p>
          <h1 className="mx-auto max-w-3xl font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Forge the Career You Deserve.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            An all-in-one platform for AI-powered CVs, online learning, certification
            and career guidance.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/register">Create Your CV <ArrowRight className="size-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/courses">Explore Courses</Link>
            </Button>
          </div>
        </section>

        <section className="container pb-16">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 rounded-xl border bg-card p-8 text-center sm:flex-row sm:text-left">
            <div className="flex-1">
              <p className="text-sm font-medium uppercase tracking-wide text-primary">One CV, one payment</p>
              <h2 className="mt-1 font-display text-2xl font-semibold">
                Just need one professional CV?
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Build it with AI help, pick a template, and download a clean, watermark-free
                PDF for a single payment of <span className="font-semibold text-foreground">{cvPriceLabel}</span>.
                No subscription required.
              </p>
            </div>
            <Button asChild size="lg">
              <Link href={user ? "/dashboard/cvs" : "/register"}>
                Build my CV <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="container pb-20">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card key={f.title}>
                <CardContent className="p-6">
                  <span className="inline-grid size-10 place-items-center rounded-md bg-primary/10 text-primary">
                    <f.icon className="size-5" />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-y bg-card">
          <div className="container grid gap-8 py-16 sm:grid-cols-3">
            {[
              ["1. Build", "Create an AI-assisted CV and pick a professional template."],
              ["2. Learn", "Enrol in courses, complete lessons and pass the exam."],
              ["3. Get certified", "Earn a verifiable certificate and share your profile."],
            ].map(([t, b]) => (
              <div key={t}>
                <h3 className="font-display text-lg font-semibold">{t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{b}</p>
              </div>
            ))}
          </div>
        </section>

        {latestJobs.length > 0 ? (
          <section className="container py-14">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="font-display text-2xl font-semibold">Latest jobs</h2>
                <p className="mt-1 text-sm text-muted-foreground">Fresh remote and on-site roles for our community.</p>
              </div>
              <Link href="/jobs" className="text-sm font-medium text-primary hover:underline">All jobs →</Link>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {latestJobs.map((j) => (
                <Link key={j.id} href={`/jobs/${j.slug}`}>
                  <Card className="h-full transition-colors hover:border-primary/40">
                    <CardContent className="p-5">
                      <p className="font-medium">{j.title}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{j.company}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {j.locationType === "REMOTE" ? "Remote" : j.locationType === "HYBRID" ? "Hybrid" : "On-site"}
                        {j.salaryText ? ` · ${j.salaryText}` : ""}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {latestPosts.length > 0 ? (
          <section className="border-t bg-card">
            <div className="container py-14">
              <div className="flex items-end justify-between">
                <h2 className="font-display text-2xl font-semibold">From the blog</h2>
                <Link href="/blog" className="text-sm font-medium text-primary hover:underline">All posts →</Link>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {latestPosts.map((p) => (
                  <Link key={p.id} href={`/blog/${p.slug}`} className="group">
                    <p className="text-xs font-medium uppercase tracking-wide text-primary">{p.categoryId ?? "Article"}</p>
                    <h3 className="mt-1 font-display text-lg font-semibold group-hover:underline">{p.title}</h3>
                    {p.excerpt ? <p className="mt-1 text-sm text-muted-foreground">{p.excerpt}</p> : null}
                    <p className="mt-2 text-xs text-muted-foreground">{formatDate(p.publishedAt ?? p.createdAt)}</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className="container py-10">
          <AdSlot placement="HOMEPAGE" path="/" className="mx-auto max-w-2xl" />
        </section>
      </main>

      <footer className="border-t">
        <div className="container flex flex-col items-center gap-3 border-b py-8 text-center">
          <p className="font-display text-lg font-semibold">Get the weekly digest</p>
          <p className="max-w-md text-sm text-muted-foreground">
            New jobs, guides and courses — one email every Monday. Unsubscribe anytime.
          </p>
          <div className="w-full max-w-sm">
            <SubscribeForm source="footer" />
          </div>
        </div>
        <div className="container flex flex-col items-center justify-between gap-4 py-8 sm:flex-row">
          <Brand />
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Career Forge. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <Link href="/jobs" className="hover:text-foreground">Jobs</Link>
            <Link href="/courses" className="hover:text-foreground">Courses</Link>
            <Link href="/products" className="hover:text-foreground">Digital products</Link>
            <Link href="/coaching" className="hover:text-foreground">Coaching</Link>
            <Link href="/blog" className="hover:text-foreground">Blog</Link>
            <Link href="/verify" className="hover:text-foreground">Verify a certificate</Link>
            <Link href="/login" className="hover:text-foreground">Log in</Link>
            <SocialLinks links={social} className="ml-1" />
          </div>
        </div>
      </footer>
    </div>
  );
}
