import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { AppShell } from "@/components/layout/app-shell";
import { unreadConversationCount } from "@/lib/messaging/service";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [unreadNotifications, unreadMessages] = await Promise.all([
    db.notification.count({ where: { userId: user.id, readAt: null } }),
    unreadConversationCount(user.id),
  ]);
  return (
    <AppShell
      user={user}
      area="Dashboard"
      badges={{
        "/dashboard/notifications": unreadNotifications,
        "/dashboard/messages": unreadMessages,
      }}
    >
      {children}
    </AppShell>
  );
}
