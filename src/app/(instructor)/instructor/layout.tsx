import { requireUser } from "@/lib/session";
import { AppShell } from "@/components/layout/app-shell";

export default async function InstructorLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <AppShell user={user} area="Instructor">
      {children}
    </AppShell>
  );
}
