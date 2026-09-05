import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { AppShell } from "@/components/layout/app-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const unreadNotifications = await db.notification.count({ where: { userId: user.id, readAt: null } });
  return (
    <AppShell user={user} area="Dashboard" badges={{ "/dashboard/notifications": unreadNotifications }}>
      {children}
    </AppShell>
  );
}
