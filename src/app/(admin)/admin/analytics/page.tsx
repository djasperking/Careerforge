import { requirePermissionPage } from "@/lib/session";
import { AdminStub } from "@/components/layout/admin-stub";

export const metadata = { title: "Analytics" };

export default async function AdminAnalyticsPage() {
  await requirePermissionPage("analytics:read");
  return (
    <AdminStub
      title="Analytics & reports"
      description="Growth, revenue, learning and advertising metrics."
      phase="Phase 10 — Production Hardening"
      scope={[
        "Users, registrations, active users",
        "Enrollment, completion, revenue trends",
        "AI usage, CV creation, exams, certificates",
        "Advertising performance and conversion rates",
        "Date filters: today, 7d, 30d, 90d, custom range",
        "Exportable reports and charts",
      ]}
    />
  );
}
