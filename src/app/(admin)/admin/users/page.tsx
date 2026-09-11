import Link from "next/link";
import { requirePermissionPage, requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { hasPermission, ADMIN_ROLES, type RoleKey } from "@/lib/rbac";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { UserRowActions } from "./user-row-actions";

export const metadata = { title: "Users" };

const PAGE_SIZE = 20;

const STATUS_VARIANT: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  ACTIVE: "success",
  PENDING: "warning",
  SUSPENDED: "destructive",
  BANNED: "destructive",
  DELETED: "secondary",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; status?: string }>;
}) {
  await requirePermissionPage("users:read");
  const me = await requireUser();
  const canManage = hasPermission(me.permissions, "users:suspend");
  const canDelete = hasPermission(me.permissions, "users:delete");
  const canAssignRoles = hasPermission(me.permissions, "users:roles");
  const isSuperAdmin = me.permissions === "*";

  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const statusFilter = sp.status;

  const where = {
    deletedAt: null,
    ...(q
      ? { OR: [{ email: { contains: q, mode: "insensitive" as const } }, { name: { contains: q, mode: "insensitive" as const } }] }
      : {}),
    ...(statusFilter ? { status: statusFilter as never } : {}),
  };

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      include: { roles: { include: { role: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.user.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <PageHeader title="Users" description={`${total} account${total === 1 ? "" : "s"}`} />

      <Card className="mb-4">
        <CardContent className="p-4">
          <form className="flex flex-wrap gap-2" method="get">
            <Input name="q" defaultValue={q} placeholder="Search by name or email" className="max-w-xs" />
            <select
              name="status"
              defaultValue={statusFilter ?? ""}
              className="h-10 rounded-md border border-input bg-card px-3 text-sm"
            >
              <option value="">All statuses</option>
              {Object.keys(STATUS_VARIANT).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <Button type="submit">Filter</Button>
          </form>
        </CardContent>
      </Card>

      {users.length === 0 ? (
        <EmptyState title="No users match your filters" />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name ?? "—"}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map((r) => (
                          <Badge key={r.roleId} variant="secondary">{r.role.name}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[u.status] ?? "secondary"}>{u.status}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(u.createdAt)}</TableCell>
                    <TableCell>
                      <UserRowActions
                        userId={u.id}
                        status={u.status}
                        emailVerified={Boolean(u.emailVerifiedAt)}
                        canManage={canManage}
                        canDelete={canDelete}
                        canAssignRoles={canAssignRoles}
                        isSuperAdmin={isSuperAdmin}
                        currentStaffRole={(u.roles.map((r) => r.role.key).find((k) => (ADMIN_ROLES as string[]).includes(k)) as RoleKey) ?? null}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            {page > 1 ? (
              <Button asChild variant="outline" size="sm">
                <Link href={{ query: { q, status: statusFilter, page: page - 1 } }}>Previous</Link>
              </Button>
            ) : null}
            {page < totalPages ? (
              <Button asChild variant="outline" size="sm">
                <Link href={{ query: { q, status: statusFilter, page: page + 1 } }}>Next</Link>
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
