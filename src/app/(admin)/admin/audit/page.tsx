import { requirePermissionPage } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Audit Logs" };

const PAGE_SIZE = 40;

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requirePermissionPage("audit:read");
  const page = Math.max(1, Number((await searchParams).page ?? "1") || 1);

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      include: { actor: true },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.auditLog.count(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <PageHeader title="Audit logs" description={`${total} recorded action${total === 1 ? "" : "s"}`} />
      <Card>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <EmptyState title="No audit records yet" className="m-6" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>{formatDate(l.createdAt, { hour: "2-digit", minute: "2-digit" })}</TableCell>
                    <TableCell>{l.actor?.email ?? "system"}</TableCell>
                    <TableCell className="font-medium">{l.action}</TableCell>
                    <TableCell>
                      {l.entity}
                      {l.entityId ? <span className="text-muted-foreground"> · {l.entityId.slice(0, 8)}</span> : null}
                    </TableCell>
                    <TableCell>{l.ip ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      {totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            {page > 1 ? (
              <Button asChild variant="outline" size="sm"><Link href={`?page=${page - 1}`}>Previous</Link></Button>
            ) : null}
            {page < totalPages ? (
              <Button asChild variant="outline" size="sm"><Link href={`?page=${page + 1}`}>Next</Link></Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
