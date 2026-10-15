import { getCurrentUser } from "@/lib/session";
import DashboardLayout from "@/app/(dashboard)/dashboard/layout";

/**
 * Courses are public, but a signed-in user browsing them keeps their sidebar
 * (the pages drop their own marketing header/footer in that case).
 */
export default async function CoursesLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) return <>{children}</>;
  return <DashboardLayout>{children}</DashboardLayout>;
}
