import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const can = (p: Parameters<typeof hasPermission>[1]) => hasPermission(user.permissions, p);

  const [reviewQueue, openTickets, payoutRequests] = await Promise.all([
    can("instructors:review")
      ? Promise.all([
          db.instructorProfile.count({ where: { status: "PENDING" } }),
          db.course.count({ where: { reviewStatus: "SUBMITTED" } }),
          db.digitalProduct.count({ where: { reviewStatus: "SUBMITTED" } }),
          db.coachingOffer.count({ where: { reviewStatus: "SUBMITTED" } }),
        ]).then((n) => n.reduce((a, b) => a + b, 0))
      : Promise.resolve(0),
    can("support:handle")
      ? db.supportTicket.count({ where: { status: { in: ["OPEN", "PENDING"] } } })
      : Promise.resolve(0),
    can("payouts:manage")
      ? db.payout.count({ where: { status: "REQUESTED" } })
      : Promise.resolve(0),
  ]);

  return (
    <AppShell
      user={user}
      area="Admin"
      badges={{
        "/admin/review": reviewQueue,
        "/admin/support": openTickets,
        "/admin/payouts": payoutRequests,
      }}
    >
      {children}
    </AppShell>
  );
}
