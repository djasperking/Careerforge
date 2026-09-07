"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X, GraduationCap, Package, CalendarClock } from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { cn } from "@/lib/utils";

const LEARN = [
  { href: "/courses", label: "Courses", desc: "Video lessons and timed exams", icon: GraduationCap },
  { href: "/products", label: "Digital products", desc: "Ebooks and templates", icon: Package },
  { href: "/coaching", label: "Coaching", desc: "1-on-1 mentor sessions", icon: CalendarClock },
];
const MOBILE_LINKS = [
  { href: "/jobs", label: "Jobs" },
  { href: "/courses", label: "Courses" },
  { href: "/products", label: "Digital products" },
  { href: "/coaching", label: "Coaching" },
  { href: "/blog", label: "Blog" },
];

const ctaClass =
  "inline-flex items-center rounded-full bg-gradient-to-r from-primary to-accent px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/30 transition-transform hover:scale-[1.03]";

export function MarketingHeader({ loggedIn }: { loggedIn: boolean }) {
  const pathname = usePathname();
  const [learnOpen, setLearnOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLearnOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setLearnOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { setLearnOpen(false); setMobileOpen(false); }
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, []);

  const learnActive = LEARN.some((l) => pathname.startsWith(l.href));
  const navLink = (href: string, active: boolean) =>
    cn("text-sm font-medium transition-colors", active ? "text-foreground" : "text-muted-foreground hover:text-foreground");

  const openLearn = () => { if (closeTimer.current) clearTimeout(closeTimer.current); setLearnOpen(true); };
  const scheduleClose = () => { closeTimer.current = setTimeout(() => setLearnOpen(false), 120); };

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-card/80 backdrop-blur-md">
      <div ref={wrapRef} className="container flex h-16 items-center gap-4">
        <Brand />

        <nav className="ml-4 hidden items-center gap-6 md:flex">
          <Link href="/jobs" className={navLink("/jobs", pathname.startsWith("/jobs"))}>Jobs</Link>

          <div className="relative" onMouseEnter={openLearn} onMouseLeave={scheduleClose}>
            <button
              type="button"
              aria-expanded={learnOpen}
              onClick={() => setLearnOpen((o) => !o)}
              className={cn("flex items-center gap-1", navLink("", learnActive))}
            >
              Learn
              <ChevronDown className={cn("size-3.5 transition-transform", learnOpen && "rotate-180")} />
            </button>
            {learnOpen ? (
              <div
                className="absolute left-0 top-full z-50 w-[320px] pt-3"
                onMouseEnter={openLearn}
                onMouseLeave={scheduleClose}
              >
                <div className="rounded-2xl border bg-card p-2 shadow-xl shadow-primary/5">
                  {LEARN.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      className="flex gap-3 rounded-xl p-3 transition-colors hover:bg-primary/5"
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                        <l.icon className="size-4" />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold">{l.label}</span>
                        <span className="block text-xs text-muted-foreground">{l.desc}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <Link href="/blog" className={navLink("/blog", pathname.startsWith("/blog"))}>Blog</Link>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {loggedIn ? (
            <Link href="/dashboard" className={ctaClass}>Dashboard</Link>
          ) : (
            <>
              <Link href="/login" className="hidden rounded-full px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground sm:block">
                Log in
              </Link>
              <Link href="/register" className={ctaClass}>Start free</Link>
            </>
          )}
          <button
            type="button"
            aria-label="Menu"
            onClick={() => setMobileOpen((o) => !o)}
            className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted md:hidden"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="border-t bg-card md:hidden">
          <nav className="container flex flex-col py-2">
            {MOBILE_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-sm font-medium",
                  pathname.startsWith(l.href) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted",
                )}
              >
                {l.label}
              </Link>
            ))}
            {!loggedIn ? (
              <Link href="/login" className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted">
                Log in
              </Link>
            ) : null}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
