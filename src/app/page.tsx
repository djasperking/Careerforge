import Link from "next/link";
import {
  ArrowRight, FileText, GraduationCap, ShieldCheck, Sparkles, BadgeCheck, BarChart3,
} from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AdSlot } from "@/components/ads/ad-slot";
import { getCurrentUser } from "@/lib/session";

const features = [
  { icon: Sparkles, title: "AI CV Builder", body: "Draft, analyse and tailor your CV to any job with an ATS match score." },
  { icon: GraduationCap, title: "Online Courses", body: "Video lessons, resources and progress tracking, validated server-side." },
  { icon: BadgeCheck, title: "Exams & Certificates", body: "Secure timed exams, auto-grading and publicly verifiable certificates." },
  { icon: ShieldCheck, title: "Secure Payments", body: "Paystack checkout with server-verified transactions and receipts." },
  { icon: BarChart3, title: "Career Guidance", body: "An AI assistant for planning, interviews, cover letters and skill gaps." },
  { icon: FileText, title: "Professional Templates", body: "A growing library of ATS-friendly, print-ready CV designs." },
];

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-card">
        <div className="container flex h-16 items-center justify-between">
          <Brand />
          <nav className="flex items-center gap-2">
            {user ? (
              <Button asChild size="sm">
                <Link href="/dashboard">Go to dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/register">Get started</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

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

        <section className="container py-10">
          <AdSlot placement="HOMEPAGE" path="/" className="mx-auto max-w-2xl" />
        </section>
      </main>

      <footer className="border-t">
        <div className="container flex flex-col items-center justify-between gap-4 py-8 sm:flex-row">
          <Brand />
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Career Forge. All rights reserved.
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/verify" className="hover:text-foreground">Verify a certificate</Link>
            <Link href="/login" className="hover:text-foreground">Log in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
