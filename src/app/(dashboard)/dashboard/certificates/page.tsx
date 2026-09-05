import Link from "next/link";
import { BadgeCheck, Download } from "lucide-react";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Certificates" };

export default async function CertificatesPage() {
  const user = await requireUser();
  const certificates = await db.certificate.findMany({
    where: { userId: user.id },
    orderBy: { issuedAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="Certificates" description="Certificates you've earned." />

      {certificates.length === 0 ? (
        <EmptyState icon={BadgeCheck} title="No certificates yet" description="Complete a course or pass an exam to earn one." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {certificates.map((c) => (
            <Card key={c.id} className={c.revokedAt ? "opacity-60" : ""}>
              <CardContent className="p-5">
                <p className="font-medium">{c.title}</p>
                <p className="text-sm text-muted-foreground">
                  Issued {formatDate(c.issuedAt)} · ID {c.publicId}
                </p>
                {c.revokedAt ? <p className="mt-1 text-xs text-destructive">Revoked</p> : null}
                <div className="mt-3 flex items-center gap-3">
                  <Button asChild size="sm" variant="outline">
                    <a href={`/api/certificates/${c.id}/pdf`} target="_blank" rel="noreferrer">
                      <Download className="size-4" /> Download PDF
                    </a>
                  </Button>
                  <Link href={`/verify/${c.publicId}`} className="text-sm text-primary hover:underline">
                    Verification page
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
