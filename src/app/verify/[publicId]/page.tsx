import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { db } from "@/lib/db";
import { Brand } from "@/components/layout/brand";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Certificate verification" };

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  const cert = await db.certificate.findUnique({
    where: { publicId: publicId.toUpperCase() },
    include: { course: true },
  });

  const valid = cert && !cert.revokedAt;

  return (
    <div className="grid min-h-screen place-items-center p-6">
      <div className="w-full max-w-lg">
        <Brand />
        <Card className="mt-8">
          <CardContent className="p-8 text-center">
            {valid ? (
              <>
                <CheckCircle2 className="mx-auto size-12 text-success" />
                <h1 className="mt-3 font-display text-xl font-semibold">Certificate verified</h1>
                <dl className="mt-6 space-y-3 text-left text-sm">
                  <div className="flex justify-between border-b pb-2">
                    <dt className="text-muted-foreground">Recipient</dt>
                    <dd className="font-medium">{cert!.studentName}</dd>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <dt className="text-muted-foreground">Title</dt>
                    <dd className="font-medium">{cert!.title}</dd>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <dt className="text-muted-foreground">Completed</dt>
                    <dd className="font-medium">{formatDate(cert!.completionDate)}</dd>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <dt className="text-muted-foreground">Certificate ID</dt>
                    <dd className="font-medium">{cert!.publicId}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Issued by</dt>
                    <dd className="font-medium">{cert!.issuerName}</dd>
                  </div>
                </dl>
              </>
            ) : (
              <>
                <XCircle className="mx-auto size-12 text-destructive" />
                <h1 className="mt-3 font-display text-xl font-semibold">
                  {cert?.revokedAt ? "Certificate revoked" : "Certificate not found"}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  We could not verify a certificate with ID <code>{publicId}</code>.
                </p>
              </>
            )}
            <Button asChild variant="outline" className="mt-8">
              <Link href="/verify">Verify another</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
