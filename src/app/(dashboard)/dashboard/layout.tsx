import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { AppShell } from "@/components/layout/app-shell";
import { unreadConversationCount } from "@/lib/messaging/service";
import { isAdminRole } from "@/lib/rbac";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [unreadNotifications, unreadMessages] = await Promise.all([
    db.notification.count({ where: { userId: user.id, readAt: null } }),
    unreadConversationCount(user.id),
  ]);
  // Staff see one consistent nav (the admin console) everywhere, instead of
  // bouncing between a "Dashboard" nav and a separate "Admin console" link.
  const area = isAdminRole(user.roles) ? "Admin" : "Dashboard";
  return (
    <AppShell
      user={user}
      area={area}
      badges={{
        "/dashboard/notifications": unreadNotifications,
        "/dashboard/messages": unreadMessages,
        "/admin/messages": unreadMessages,
      }}
    >
      {children}
    </AppShell>
  );
}
