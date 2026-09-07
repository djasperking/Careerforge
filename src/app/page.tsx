import Link from "next/link";
import {
  ArrowRight, Sparkles, GraduationCap, BadgeCheck, Briefcase,
  CalendarClock, BarChart3, MapPin,
} from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { SocialLinks } from "@/components/layout/social-links";
import { SubscribeForm } from "@/components/newsletter/subscribe-form";
import { Hero } from "@/components/home/hero";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/session";
import { getSocialLinks, getPlatformStats } from "@/lib/site";
import { listPublicJobs } from "@/lib/jobs/service";
import { listPublishedPosts } from "@/lib/blog/service";
import { formatDate } from "@/lib/utils";

const pillars = [
  { icon: Sparkles, title: "AI CV Builder", body: "Draft, analyse and tailor your CV to any job with a live ATS match score and honest AI edits.", href: "/register", accent: "from-primary/15 to-primary/5 text-primary" },
  { icon: GraduationCap, title: "Courses & Exams", body: "Structured video courses, secure timed exams, and progress tracked on the server — not the client.", href: "/courses", accent: "from-secondary/15 to-secondary/5 text-secondary" },
  { icon: BadgeCheck, title: "Verifiable Certificates", body: "Pass and earn a certificate with a public verification page you can put on LinkedIn.", href: "/verify", accent: "from-success/15 to-success/5 text-success" },
  { icon: Briefcase, title: "Jobs Board", body: "Curated remote annotation and AI-training roles, refreshed weekly, with how-to-apply notes.", href: "/jobs", accent: "from-accent/15 to-accent/5 text-accent" },
  { icon: CalendarClock, title: "1-on-1 Coaching", body: "Book a vetted instructor for portfolio review, interview prep or a career plan.", href: "/coaching", accent: "from-warning/15 to-warning/5 text-warning" },
  { icon: BarChart3, title: "Career Guidance", body: "An AI assistant for planning, cover letters, skill-gap analysis and interview practice.", href: "/register", accent: "from-primary/15 to-accent/5 text-primary" },
];

const marqueeItems = [
  "Data annotation", "RLHF", "Prompt evaluation", "Image labelling", "ATS-ready CVs",
  "Remote work", "AI training data", "Earn in dollars", "Verifiable certificates", "Interview prep",
];

const steps = [
  { n: "01", t: "Build", d: "Create an AI-assisted CV and pick a professional template — free." },
  { n: "02", t: "Learn", d: "Take a course, complete the lessons and pass the exam." },
  { n: "03", t: "Get hired", d: "Earn a verifiable certificate and apply to jobs on the board." },
];

export default async function HomePage() {
  const [user, social, stats, latestJobs, latestPosts] = await Promise.all([
    getCurrentUser(),
    getSocialLinks(),
    getPlatformStats(),
    listPublicJobs().then((j) => j.slice(0, 4)),
    listPublishedPosts({ take: 3 }),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader loggedIn={Boolean(user)} />

      <main className="flex-1">
        <Hero loggedIn={Boolean(user)} stats={stats} />

        {/* marquee */}
        <div className="border-y bg-card/50 py-4">
          <div className="relative flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
            <div className="cf-marquee flex shrink-0 items-center gap-3 pr-3">
              {[...marqueeItems, ...marqueeItems].map((m, i) => (
                <span key={i} className="whitespace-nowrap rounded-full border bg-background px-3 py-1 text-sm text-muted-foreground">
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* pillars */}
        <section className="container py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Everything you need, in one place</h2>
            <p className="mt-3 text-muted-foreground">
              From a blank page to a paid remote role — Career Forge covers the whole journey.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pillars.map((p) => (
              <Link key={p.title} href={p.href}>
                <Card className="group h-full transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
                  <CardContent className="p-6">
                    <span className={`inline-grid size-11 place-items-center rounded-xl bg-gradient-to-br ${p.accent}`}>
                      <p.icon className="size-5" />
                    </span>
                    <h3 className="mt-4 font-display text-lg font-semibold">{p.title}</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">{p.body}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      Learn more <ArrowRight className="size-3.5" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* how it works */}
        <section className="border-y bg-card">
          <div className="container py-20">
            <h2 className="text-center font-display text-3xl font-bold tracking-tight sm:text-4xl">How it works</h2>
            <div className="relative mt-14 grid gap-10 sm:grid-cols-3">
              <div aria-hidden className="absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent sm:block" />
              {steps.map((s) => (
                <div key={s.n} className="relative text-center">
                  <span className="mx-auto grid size-12 place-items-center rounded-full border-2 border-primary/30 bg-background font-display text-sm font-bold text-primary">
                    {s.n}
                  </span>
                  <h3 className="mt-4 font-display text-lg font-semibold">{s.t}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* latest jobs */}
        {latestJobs.length > 0 ? (
          <section className="container py-20">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold sm:text-3xl">Latest jobs</h2>
                <p className="mt-1 text-sm text-muted-foreground">Fresh remote and on-site roles for our community.</p>
              </div>
              <Link href="/jobs" className="text-sm font-medium text-primary hover:underline">All jobs →</Link>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {latestJobs.map((j) => (
                <Link key={j.id} href={`/jobs/${j.slug}`}>
                  <Card className="h-full transition-colors hover:border-primary/40">
                    <CardContent className="flex items-start justify-between gap-3 p-5">
                      <div>
                        <p className="font-medium">{j.title}</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">{j.company}</p>
                        <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="size-3" />
                          {j.locationType === "REMOTE" ? "Remote" : j.locationType === "HYBRID" ? "Hybrid" : "On-site"}
                          {j.salaryText ? ` · ${j.salaryText}` : ""}
                        </p>
                      </div>
                      <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {/* blog */}
        {latestPosts.length > 0 ? (
          <section className="border-t bg-card">
            <div className="container py-20">
              <div className="flex items-end justify-between">
                <h2 className="font-display text-2xl font-bold sm:text-3xl">From the blog</h2>
                <Link href="/blog" className="text-sm font-medium text-primary hover:underline">All posts →</Link>
              </div>
              <div className="mt-8 grid gap-6 sm:grid-cols-3">
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

        {/* CTA band */}
        <section className="container py-20">
          <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-16 text-center text-primary-foreground sm:px-16">
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <div className="cf-animate-blob absolute -left-10 -top-10 size-64 rounded-full bg-white/10 blur-2xl" />
              <div className="cf-animate-blob absolute -right-10 bottom-0 size-72 rounded-full bg-accent/30 blur-2xl [animation-delay:-8s]" />
            </div>
            <h2 className="relative font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Forge the career you deserve
            </h2>
            <p className="relative mx-auto mt-3 max-w-xl text-primary-foreground/80">
              Start with a free CV today. Learn a skill, get certified, and apply to real jobs — all in one place.
            </p>
            <div className="relative mt-8">
              <Link
                href={user ? "/dashboard" : "/register"}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-medium text-primary shadow-lg transition-transform hover:scale-[1.02]"
              >
                {user ? "Go to your dashboard" : "Get started free"} <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="container flex flex-col items-center gap-3 border-b py-10 text-center">
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
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Career Forge. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <Link href="/jobs" className="hover:text-foreground">Jobs</Link>
            <Link href="/courses" className="hover:text-foreground">Courses</Link>
            <Link href="/products" className="hover:text-foreground">Digital products</Link>
            <Link href="/coaching" className="hover:text-foreground">Coaching</Link>
            <Link href="/blog" className="hover:text-foreground">Blog</Link>
            <Link href="/verify" className="hover:text-foreground">Verify a certificate</Link>
            <SocialLinks links={social} className="ml-1" />
          </div>
        </div>
      </footer>
    </div>
  );
}
