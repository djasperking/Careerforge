"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { SidebarNav } from "./sidebar-nav";
import { SignOutButton } from "./sign-out-button";
import { Brand } from "./brand";
import type { PermissionKey } from "@/lib/rbac";
import { cn } from "@/lib/utils";

/**
 * Slide-in navigation drawer for < md screens. The desktop sidebar is
 * `hidden md:flex`, so without this there is no way to navigate on a phone.
 */
export function MobileNav({
  area,
  permissions,
  badges,
  showAdminLink,
  user,
}: {
  area: "Dashboard" | "Admin" | "Instructor";
  permissions: PermissionKey[] | "*";
  badges?: Record<string, number>;
  showAdminLink?: boolean;
  user: { name?: string | null; email: string; image?: string | null };
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on navigation.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll + close on Escape while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const initial = (user.name ?? "").trim().charAt(0).toUpperCase() || "?";

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="grid size-9 shrink-0 place-items-center rounded-md border text-foreground"
      >
        <Menu className="size-5" />
      </button>

      <div
        className={cn(
          "fixed inset-0 z-50 md:hidden",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!open}
      >
        <div
          onClick={() => setOpen(false)}
          className={cn(
            "absolute inset-0 bg-black/50 transition-opacity",
            open ? "opacity-100" : "opacity-0",
          )}
        />
        <div
          className={cn(
            "absolute inset-y-0 left-0 flex w-[82%] max-w-xs flex-col border-r bg-card shadow-xl transition-transform",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex items-center justify-between border-b p-4">
            <div>
              <Brand href={area === "Admin" ? "/admin" : area === "Instructor" ? "/instructor" : "/dashboard"} />
              <p className="mt-1 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{area}</p>
            </div>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="grid size-8 place-items-center rounded-md hover:bg-muted"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            <SidebarNav area={area} permissions={permissions} badges={badges} showAdminLink={showAdminLink} />
          </div>

          <div className="border-t p-3">
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-2 rounded-md p-2 transition-colors hover:bg-muted"
            >
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.image} alt="" className="size-8 shrink-0 rounded-full border object-cover" />
              ) : (
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {initial}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{user.name ?? "Account"}</span>
                <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
              </span>
            </Link>
            <div className="mt-2">
              <SignOutButton />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
