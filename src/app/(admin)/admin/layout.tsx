import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { unreadConversationCount } from "@/lib/messaging/service";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const can = (p: Parameters<typeof hasPermission>[1]) => hasPermission(user.permissions, p);

  const [reviewQueue, openTickets, payoutRequests, unreadMessages] = await Promise.all([
    Promise.all([
      can("instructors:review")
        ? db.instructorProfile.count({ where: { status: "PENDING" } })
        : Promise.resolve(0),
      can("submissions:review")
        ? Promise.all([
            db.course.count({ where: { reviewStatus: "SUBMITTED" } }),
            db.digitalProduct.count({ where: { reviewStatus: "SUBMITTED" } }),
            db.coachingOffer.count({ where: { reviewStatus: "SUBMITTED" } }),
          ]).then((n) => n.reduce((a, b) => a + b, 0))
        : Promise.resolve(0),
    ]).then((n) => n.reduce((a, b) => a + b, 0)),
    can("support:handle")
      ? db.supportTicket.count({ where: { status: { in: ["OPEN", "PENDING"] } } })
      : Promise.resolve(0),
    can("payouts:manage")
      ? db.payout.count({ where: { status: "REQUESTED" } })
      : Promise.resolve(0),
    unreadConversationCount(user.id),
  ]);

  return (
    <AppShell
      user={user}
      area="Admin"
      badges={{
        "/admin/review": reviewQueue,
        "/admin/support": openTickets,
        "/admin/payouts": payoutRequests,
        "/dashboard/messages": unreadMessages,
      }}
    >
      {children}
    </AppShell>
  );
}
