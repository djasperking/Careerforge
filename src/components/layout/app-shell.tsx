import { Brand } from "./brand";
import { SidebarNav } from "./sidebar-nav";
import { SignOutButton } from "./sign-out-button";
import type { PermissionKey } from "@/lib/rbac";

/**
 * Shared authenticated layout for both the customer dashboard and the admin
 * console. Only serializable data crosses into the client SidebarNav.
 */
export function AppShell({
  user,
  area,
  badges,
  children,
}: {
  user: { name?: string | null; email: string; permissions: PermissionKey[] | "*" };
  area: "Dashboard" | "Admin";
  badges?: Record<string, number>;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-card p-4 md:flex">
        <div className="px-2 py-2">
          <Brand href={area === "Admin" ? "/admin" : "/dashboard"} />
          <p className="mt-1 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {area}
          </p>
        </div>
        <div className="mt-4 flex-1 overflow-y-auto">
          <SidebarNav area={area} permissions={user.permissions} badges={badges} />
        </div>
        <div className="mt-4 border-t pt-3">
          <p className="truncate px-3 text-sm font-medium">{user.name ?? "Account"}</p>
          <p className="truncate px-3 text-xs text-muted-foreground">{user.email}</p>
          <div className="mt-2">
            <SignOutButton />
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b bg-card px-4 py-3 md:hidden">
          <Brand href={area === "Admin" ? "/admin" : "/dashboard"} />
          <SignOutButton />
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
