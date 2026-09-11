import { requireUser } from "@/lib/session";
import { AppShell } from "@/components/layout/app-shell";
import { unreadConversationCount } from "@/lib/messaging/service";
import { isAdminRole } from "@/lib/rbac";

export default async function InstructorLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const unreadMessages = await unreadConversationCount(user.id);
  // Staff see one consistent nav (the admin console) everywhere, instead of
  // bouncing between an "Instructor" nav and a separate "Admin console" link.
  const area = isAdminRole(user.roles) ? "Admin" : "Instructor";
  return (
    <AppShell user={user} area={area} badges={{ "/dashboard/messages": unreadMessages, "/admin/messages": unreadMessages }}>
      {children}
    </AppShell>
  );
}
