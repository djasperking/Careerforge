"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { adminNav, customerNav, instructorNav, type NavItem } from "./nav-config";
import { hasPermission, type PermissionKey } from "@/lib/rbac";
import { cn } from "@/lib/utils";

/**
 * Client component: owns the nav config (icons are React components and can't
 * cross the server→client boundary as props), filters by the current user's
 * permissions and highlights the active route. Items with `children` are
 * dropdowns that open and close on click.
 */
export function SidebarNav({
  area,
  permissions,
  badges,
}: {
  area: "Dashboard" | "Admin" | "Instructor";
  permissions: PermissionKey[] | "*";
  badges?: Record<string, number>;
}) {
  const pathname = usePathname();
  const nav = area === "Admin" ? adminNav : area === "Instructor" ? instructorNav : customerNav;
  const items: NavItem[] = nav.filter((i) => !i.permission || hasPermission(permissions, i.permission));
  const root = area === "Admin" ? "/admin" : area === "Instructor" ? "/instructor" : "/dashboard";

  // Groups the user opened or closed by hand; anything not listed follows the current page.
  const [manual, setManual] = useState<Record<string, boolean>>({});

  const isActive = (item: NavItem) =>
    item.href === root
      ? pathname === root
      : pathname === item.href ||
        pathname.startsWith(item.href + "/") ||
        (item.matchPrefixes?.some((p) => pathname.startsWith(p)) ?? false);

  let lastGroup: string | undefined;

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const showGroup = item.group && item.group !== lastGroup;
        lastGroup = item.group;
        const heading = showGroup ? (
          <p className="mb-1 mt-3 px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
            {item.group}
          </p>
        ) : null;

        if (item.children) {
          const children = item.children.filter((c) => !c.permission || hasPermission(permissions, c.permission));
          const hasActive = children.some(isActive);
          const open = manual[item.label] ?? hasActive;
          const groupBadge = children.reduce((n, c) => n + (badges?.[c.href] ?? 0), 0);
          const panelId = `nav-${item.label.replace(/\W+/g, "-").toLowerCase()}`;
          return (
            <div key={item.label}>
              {heading}
              <button
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setManual((m) => ({ ...m, [item.label]: !open }))}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors",
                  hasActive ? "text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="size-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {!open && groupBadge ? (
                  <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 py-0.5 text-xs font-semibold text-destructive-foreground">
                    {groupBadge > 99 ? "99+" : groupBadge}
                  </span>
                ) : null}
                <ChevronDown className={cn("size-4 shrink-0 transition-transform", open && "rotate-180")} />
              </button>
              {open ? (
                <div id={panelId} className="ml-4 mt-1 flex flex-col gap-1 border-l pl-2">
                  {children.map((child) => (
                    <NavLink key={child.href} item={child} active={isActive(child)} badge={badges?.[child.href]} />
                  ))}
                </div>
              ) : null}
            </div>
          );
        }

        return (
          <div key={item.href}>
            {heading}
            <NavLink item={item} active={isActive(item)} badge={badges?.[item.href]} />
          </div>
        );
      })}
    </nav>
  );
}

function NavLink({ item, active, badge }: { item: NavItem; active: boolean; badge?: number }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <item.icon className="size-4 shrink-0" />
      <span className="flex-1">{item.label}</span>
      {badge ? (
        <span
          className={cn(
            "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-semibold",
            active ? "bg-primary-foreground/20" : "bg-destructive text-destructive-foreground",
          )}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
    </Link>
  );
}
