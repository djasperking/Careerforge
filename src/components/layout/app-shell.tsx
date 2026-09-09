import Link from "next/link";
import { Brand } from "./brand";
import { SidebarNav } from "./sidebar-nav";
import { SignOutButton } from "./sign-out-button";
import { isAdminRole, type PermissionKey } from "@/lib/rbac";

function Avatar({ name, image, size = 36 }: { name?: string | null; image?: string | null; size?: number }) {
  const initial = (name ?? "").trim().charAt(0).toUpperCase() || "?";
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt=""
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="shrink-0 rounded-full border object-cover"
      />
    );
  }
  return (
    <span
      style={{ width: size, height: size }}
      className="grid shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
    >
      {initial}
    </span>
  );
}

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
  user: { name?: string | null; email: string; image?: string | null; roles: string[]; permissions: PermissionKey[] | "*" };
  area: "Dashboard" | "Admin" | "Instructor";
  badges?: Record<string, number>;
  children: React.ReactNode;
}) {
  const showAdminLink = area !== "Admin" && isAdminRole(user.roles);
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-card p-4 md:flex">
        <div className="px-2 py-2">
          <Brand href={area === "Admin" ? "/admin" : area === "Instructor" ? "/instructor" : "/dashboard"} />
          <p className="mt-1 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {area}
          </p>
        </div>
        <div className="mt-4 flex-1 overflow-y-auto">
          <SidebarNav area={area} permissions={user.permissions} badges={badges} showAdminLink={showAdminLink} />
        </div>
        <div className="mt-4 border-t pt-3">
          <Link
            href="/dashboard/profile"
            className="flex items-center gap-2 rounded-md px-1 py-1.5 transition-colors hover:bg-muted"
          >
            <Avatar name={user.name} image={user.image} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.name ?? "Account"}</p>
              <p className="truncate text-xs text-muted-foreground">View profile</p>
            </div>
          </Link>
          <div className="mt-2">
            <SignOutButton />
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b bg-card px-4 py-3 md:hidden">
          <Brand href={area === "Admin" ? "/admin" : area === "Instructor" ? "/instructor" : "/dashboard"} />
          <div className="flex items-center gap-2">
            <Link href="/dashboard/profile" aria-label="View profile">
              <Avatar name={user.name} image={user.image} size={28} />
            </Link>
            <SignOutButton />
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
