"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, FileText, GraduationCap, Briefcase, CalendarClock, BadgeCheck, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ForgeMark } from "@/components/layout/forge-mark";
import { cn } from "@/lib/utils";

const ROTATING = ["CV", "career", "skills", "future"];

type Slide = {
  key: string;
  tag: string;
  icon: typeof FileText;
  title: string;
  line: string;
  visual: React.ReactNode;
};

function CvVisual() {
  return (
    <div className="relative">
      <div className="rounded-xl border border-border/70 bg-white p-4 shadow-sm dark:bg-card">
        <div className="flex items-center gap-2 border-b pb-2">
          <span className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground">
            <ForgeMark className="size-4" />
          </span>
          <div className="h-2.5 w-24 rounded-full bg-foreground/80" />
          <div className="ml-auto h-2 w-10 rounded-full bg-muted-foreground/30" />
        </div>
        <div className="mt-3 space-y-2">
          <div className="h-2 w-3/4 rounded-full bg-foreground/15" />
          <div className="h-2 w-full rounded-full bg-foreground/10" />
          <div className="h-2 w-5/6 rounded-full bg-foreground/10" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {["Experience", "Skills", "Education", "Projects"].map((s) => (
            <div key={s} className="rounded-lg border bg-muted/40 p-2">
              <div className="h-1.5 w-12 rounded-full bg-primary/50" />
              <div className="mt-1.5 h-1.5 w-full rounded-full bg-foreground/10" />
              <div className="mt-1 h-1.5 w-2/3 rounded-full bg-foreground/10" />
            </div>
          ))}
        </div>
      </div>
      <div className="cf-animate-float absolute -right-3 -top-3 flex items-center gap-1.5 rounded-full bg-success px-3 py-1.5 text-xs font-semibold text-success-foreground shadow-lg">
        <Sparkles className="size-3.5" /> ATS match 94%
      </div>
    </div>
  );
}

function CertVisual() {
  return (
    <div className="relative">
      <div className="rounded-xl border-2 border-primary/25 bg-white p-5 text-center shadow-sm dark:bg-card">
        <BadgeCheck className="mx-auto size-8 text-primary" />
        <p className="mt-2 font-display text-sm font-bold">Certificate of Completion</p>
        <div className="mx-auto mt-3 h-2 w-32 rounded-full bg-foreground/70" />
        <p className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">Data Annotation &amp; AI Training</p>
        <div className="mt-4 flex items-center justify-between">
          <div className="h-1.5 w-14 rounded-full bg-foreground/15" />
          <span className="grid size-6 place-items-center rounded-full border border-primary/30 text-primary">
            <ForgeMark className="size-3" />
          </span>
          <div className="h-1.5 w-14 rounded-full bg-foreground/15" />
        </div>
      </div>
      <div className="cf-animate-float absolute -left-3 -bottom-3 rounded-lg bg-card px-3 py-2 text-xs font-medium shadow-lg ring-1 ring-border">
        ✅ Publicly verifiable
      </div>
    </div>
  );
}

function JobsVisual() {
  return (
    <div className="space-y-2">
      {[
        { t: "Data Annotator (Remote)", c: "Scale AI", p: "$600–$1,200/mo" },
        { t: "AI Training Specialist", c: "Outlier", p: "$15–$25/hr" },
        { t: "RLHF Reviewer", c: "Remotasks", p: "Contract" },
      ].map((j, i) => (
        <div
          key={j.t}
          className={cn(
            "flex items-center justify-between rounded-xl border bg-white p-3 shadow-sm dark:bg-card",
            i === 0 && "ring-2 ring-primary/40",
          )}
        >
          <div>
            <p className="text-sm font-semibold">{j.t}</p>
            <p className="text-xs text-muted-foreground">{j.c} · {j.p}</p>
          </div>
          <span className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground">Apply</span>
        </div>
      ))}
    </div>
  );
}

function CoachingVisual() {
  return (
    <div className="relative rounded-xl border bg-white p-4 shadow-sm dark:bg-card">
      <p className="text-sm font-semibold">Book a 1-on-1 session</p>
      <div className="mt-3 grid grid-cols-4 gap-1.5">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "grid h-7 place-items-center rounded-md text-[10px]",
              i === 5 ? "bg-primary text-primary-foreground font-semibold" : "bg-muted/50 text-muted-foreground",
            )}
          >
            {9 + (i % 6)}:00
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-lg bg-muted/40 p-2 text-xs">
        <span className="grid size-6 place-items-center rounded-full bg-accent/20 text-accent">★</span>
        Mentor review · portfolio &amp; interview prep
      </div>
    </div>
  );
}

const SLIDES: Slide[] = [
  { key: "cv", tag: "AI CV Builder", icon: FileText, title: "A CV that beats the bots", line: "Draft, analyse and tailor it to any job — with a live ATS match score.", visual: <CvVisual /> },
  { key: "learn", tag: "Courses & Certificates", icon: GraduationCap, title: "Learn the skill, prove it", line: "Video courses, timed exams and a certificate anyone can verify.", visual: <CertVisual /> },
  { key: "jobs", tag: "Jobs board", icon: Briefcase, title: "See who's hiring", line: "A weekly feed of real openings at other companies — you apply.", visual: <JobsVisual /> },
  { key: "coach", tag: "1-on-1 Coaching", icon: CalendarClock, title: "Get a mentor in your corner", line: "Book a vetted instructor for portfolio and interview prep.", visual: <CoachingVisual /> },
];

export function Hero({ loggedIn, stats }: { loggedIn: boolean; stats: { label: string; value: string }[] }) {
  const [word, setWord] = useState(0);
  const [slide, setSlide] = useState(0);
  const paused = useRef(false);

  useEffect(() => {
    const t = setInterval(() => setWord((w) => (w + 1) % ROTATING.length), 2200);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      if (!paused.current) setSlide((s) => (s + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const active = SLIDES[slide];

  return (
    <section className="relative overflow-hidden">
      {/* backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-[60%] bg-gradient-to-b from-primary/[0.07] to-transparent" />
        <div className="absolute inset-0 cf-grid-bg opacity-80" />
        <div className="cf-animate-blob absolute -left-20 -top-16 size-[30rem] rounded-full bg-primary/30 blur-[100px]" />
        <div className="cf-animate-blob absolute -right-20 top-4 size-[28rem] rounded-full bg-accent/25 blur-[100px] [animation-delay:-6s]" />
        <div className="cf-animate-blob absolute -bottom-10 left-1/4 size-[24rem] rounded-full bg-secondary/25 blur-[100px] [animation-delay:-12s]" />
      </div>

      <div className="container grid gap-12 py-16 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:py-24">
        <div className="cf-rise">
          <span className="inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            New: jobs board + weekly digest
          </span>

          <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Forge your{" "}
            <span key={word} className="cf-gradient-text cf-word">{ROTATING[word]}</span>.
            <br />
            Land the work.
          </h1>

          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            We train you in the skills companies hire for — data annotation, AI training and more —
            then hand you the certificate, CV and coaching to go land the work yourself.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="group">
              <Link href={loggedIn ? "/dashboard" : "/register"}>
                {loggedIn ? "Go to dashboard" : "Start free"}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/courses">Explore courses</Link>
            </Button>
          </div>

          {stats.length > 0 ? (
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4">
              {stats.map((s) => (
                <div key={s.label}>
                  <dt className="font-display text-2xl font-bold">{s.value}</dt>
                  <dd className="text-xs text-muted-foreground">{s.label}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>

        {/* showcase slideshow */}
        <div
          className="cf-rise [animation-delay:120ms]"
          onMouseEnter={() => (paused.current = true)}
          onMouseLeave={() => (paused.current = false)}
        >
          <div className="relative rounded-2xl border bg-card/80 p-4 shadow-2xl shadow-primary/10 backdrop-blur-xl sm:p-6">
            <div className="mb-3 flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-destructive/60" />
              <span className="size-2.5 rounded-full bg-warning/60" />
              <span className="size-2.5 rounded-full bg-success/60" />
              <span className="ml-2 inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                <active.icon className="size-3.5" /> {active.tag}
              </span>
            </div>

            <div className="relative min-h-[280px]">
              {SLIDES.map((s, i) => (
                <div
                  key={s.key}
                  className={cn(
                    "absolute inset-0 transition-all duration-500",
                    i === slide ? "translate-x-0 opacity-100" : "pointer-events-none translate-x-4 opacity-0",
                  )}
                >
                  {s.visual}
                  <div className="mt-4">
                    <p className="font-display text-lg font-bold">{s.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{s.line}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-1.5">
              {SLIDES.map((s, i) => (
                <button
                  key={s.key}
                  aria-label={`Show ${s.tag}`}
                  onClick={() => setSlide(i)}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === slide ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50",
                  )}
                />
              ))}
              <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="size-3 fill-warning text-warning" /> Loved by learners
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
