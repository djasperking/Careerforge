import Link from "next/link";
import { requirePermissionPage } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Support" };

const STATUS_VARIANT: Record<string, "success" | "secondary" | "warning"> = {
  OPEN: "warning", PENDING: "secondary", IN_PROGRESS: "secondary", RESOLVED: "success", CLOSED: "secondary",
};

export default async function AdminSupportPage() {
  await requirePermissionPage("support:handle");
  const tickets = await db.supportTicket.findMany({
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: { user: true, assignedTo: true },
  });

  return (
    <div>
      <PageHeader title="Support tickets" description="Customer support queue." />
      <Card>
        <CardContent className="p-0">
          {tickets.length === 0 ? (
            <EmptyState title="No tickets yet" className="m-6" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((t) => (
                  <TableRow key={t.id} className="cursor-pointer">
                    <TableCell className="font-medium">
                      <Link href={`/admin/support/${t.id}`} className="hover:underline">{t.subject}</Link>
                    </TableCell>
                    <TableCell>{t.user.email}</TableCell>
                    <TableCell>{t.category}</TableCell>
                    <TableCell>{t.assignedTo?.name ?? t.assignedTo?.email ?? "—"}</TableCell>
                    <TableCell><Badge variant={STATUS_VARIANT[t.status]}>{t.status}</Badge></TableCell>
                    <TableCell>{formatDate(t.updatedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
