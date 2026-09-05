import { requirePermissionPage } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import { CertificateActions } from "./certificate-actions";

export const metadata = { title: "Certificates" };

export default async function AdminCertificatesPage() {
  await requirePermissionPage("courses:read");
  const certificates = await db.certificate.findMany({
    include: { user: true, course: true },
    orderBy: { issuedAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <PageHeader title="Certificates" description={`${certificates.length} issued`} />
      <Card>
        <CardContent className="p-0">
          {certificates.length === 0 ? (
            <EmptyState title="No certificates issued yet" className="m-6" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {certificates.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.user.email}</TableCell>
                    <TableCell className="font-medium">{c.title}</TableCell>
                    <TableCell>{c.publicId}</TableCell>
                    <TableCell>{formatDate(c.issuedAt)}</TableCell>
                    <TableCell>
                      <Badge variant={c.revokedAt ? "destructive" : "success"}>{c.revokedAt ? "Revoked" : "Valid"}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <CertificateActions id={c.id} revoked={!!c.revokedAt} />
                    </TableCell>
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
