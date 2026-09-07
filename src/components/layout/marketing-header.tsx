import Link from "next/link";
import { Brand } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";

const LINKS = [
  { href: "/jobs", label: "Jobs" },
  { href: "/courses", label: "Courses" },
  { href: "/products", label: "Digital products" },
  { href: "/coaching", label: "Coaching" },
  { href: "/blog", label: "Blog" },
];

/** Shared header for the public marketing / catalogue pages. */
export function MarketingHeader({ loggedIn }: { loggedIn: boolean }) {
  return (
    <header className="border-b bg-card">
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Brand />
          <nav className="hidden items-center gap-4 text-sm font-medium text-muted-foreground sm:flex">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-foreground">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {loggedIn ? (
            <Button asChild size="sm">
              <Link href="/dashboard">Dashboard</Link>
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
        </div>
      </div>
      <nav className="container flex items-center gap-4 pb-3 text-sm font-medium text-muted-foreground sm:hidden">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="hover:text-foreground">
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
