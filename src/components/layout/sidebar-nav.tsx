"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield } from "lucide-react";
import { adminNav, customerNav, instructorNav, type NavItem } from "./nav-config";
import { hasPermission, type PermissionKey } from "@/lib/rbac";
import { cn } from "@/lib/utils";

/**
 * Client component: owns the nav config (icons are React components and can't
 * cross the server→client boundary as props), filters by the current user's
 * permissions and highlights the active route.
 */
export function SidebarNav({
  area,
  permissions,
  badges,
  showAdminLink = false,
}: {
  area: "Dashboard" | "Admin" | "Instructor";
  permissions: PermissionKey[] | "*";
  badges?: Record<string, number>;
  showAdminLink?: boolean;
}) {
  const pathname = usePathname();
  const nav = area === "Admin" ? adminNav : area === "Instructor" ? instructorNav : customerNav;
  const items: NavItem[] = nav.filter((i) => !i.permission || hasPermission(permissions, i.permission));
  if (showAdminLink) items.push({ label: "Admin console", href: "/admin", icon: Shield });
  const root = area === "Admin" ? "/admin" : area === "Instructor" ? "/instructor" : "/dashboard";

  let lastGroup: string | undefined;

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active = item.href === root ? pathname === root : pathname.startsWith(item.href);
        const badge = badges?.[item.href];
        const showGroup = item.group && item.group !== lastGroup;
        lastGroup = item.group;
        return (
          <div key={item.href}>
            {showGroup ? (
              <p className="mb-1 mt-3 px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
                {item.group}
              </p>
            ) : null}
            <Link
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
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
          </div>
        );
      })}
    </nav>
  );
}
