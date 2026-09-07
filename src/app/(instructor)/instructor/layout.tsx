import { requireUser } from "@/lib/session";
import { AppShell } from "@/components/layout/app-shell";
import { unreadConversationCount } from "@/lib/messaging/service";

export default async function InstructorLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const unreadMessages = await unreadConversationCount(user.id);
  return (
    <AppShell user={user} area="Instructor" badges={{ "/dashboard/messages": unreadMessages }}>
      {children}
    </AppShell>
  );
}
