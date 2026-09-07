import Link from "next/link";
import { ForgeMark } from "@/components/layout/forge-mark";
import { SocialLinks } from "@/components/layout/social-links";
import { SubscribeForm } from "@/components/newsletter/subscribe-form";
import { getSocialLinks } from "@/lib/site";

const EXPLORE = [
  { href: "/jobs", label: "Jobs" },
  { href: "/courses", label: "Courses" },
  { href: "/products", label: "Digital products" },
  { href: "/coaching", label: "Coaching" },
  { href: "/blog", label: "Blog" },
];
const MORE = [
  { href: "/instructor", label: "Teach on Career Forge" },
  { href: "/verify", label: "Verify a certificate" },
  { href: "/newsletter", label: "Newsletter" },
  { href: "/dashboard/support", label: "Support" },
  { href: "/login", label: "Log in" },
];
const LEGAL = [
  { href: "/legal/terms", label: "Terms" },
  { href: "/legal/privacy", label: "Privacy" },
  { href: "/legal/refund", label: "Refunds" },
];

export async function SiteFooter() {
  const social = await getSocialLinks();

  return (
    <footer className="relative overflow-hidden bg-[#15173f] text-white/70">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-40 size-[26rem] rounded-full bg-accent/35 blur-[110px]"
      />
      <div className="container relative py-16">
        <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-2.5 font-display text-lg font-bold text-white">
              <span className="grid size-8 place-items-center rounded-lg bg-white text-primary">
                <ForgeMark className="size-5" />
              </span>
              Career<span className="text-[#b9c0ff]">Forge</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-white/60">
              New jobs, guides and courses — one email a week. No spam.
            </p>
            <div className="mt-4 max-w-sm">
              <SubscribeForm source="footer" onDark />
            </div>
          </div>

          <FooterCol title="Explore" links={EXPLORE} />
          <FooterCol title="More" links={MORE} />
        </div>

        <p
          aria-hidden
          className="mt-10 select-none bg-gradient-to-b from-white/[0.14] to-white/[0.02] bg-clip-text font-display text-[clamp(3rem,13vw,8rem)] font-extrabold leading-[0.85] tracking-tighter text-transparent"
        >
          CareerForge
        </p>

        <div className="mt-4 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-6 text-xs text-white/45 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>© {new Date().getFullYear()} Career Forge. All rights reserved.</span>
            {LEGAL.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-white/80">{l.label}</Link>
            ))}
          </div>
          <SocialLinks links={social} onDark />
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <p className="font-display text-xs font-medium uppercase tracking-widest text-white/40">{title}</p>
      <ul className="mt-3 space-y-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-sm text-white/70 transition-colors hover:text-white">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
