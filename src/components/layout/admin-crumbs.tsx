"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { adminNav } from "./nav-config";

/** "Admin › Money › Payments" — tells staff where they are, with a link back to the dashboard. */
export function AdminCrumbs() {
  const pathname = usePathname();
  const current = adminNav
    .filter((i) => i.href !== "/admin" && (pathname === i.href || pathname.startsWith(i.href + "/")))
    .sort((a, b) => b.href.length - a.href.length)[0];
  if (!current) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
      <Link href="/admin" className="hover:text-foreground">Admin</Link>
      {current.group ? (
        <>
          <ChevronRight className="size-3.5" />
          <span>{current.group}</span>
        </>
      ) : null}
      <ChevronRight className="size-3.5" />
      <Link href={current.href} className="font-medium text-foreground">{current.label}</Link>
    </nav>
  );
}
