import Link from "next/link";
import { Award, BadgeCheck, ShieldAlert, ShieldCheck } from "lucide-react";
import { db } from "@/lib/db";
import { Brand } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Certificate verification", robots: { index: false } };

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  const cert = await db.certificate.findUnique({
    where: { publicId: publicId.toUpperCase() },
  });

  const valid = Boolean(cert && !cert.revokedAt);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-transparent px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-xl">
        <div className="flex justify-center">
          <Brand />
        </div>

        {valid && cert ? (
          <article className="mt-8 overflow-hidden rounded-2xl border-2 border-amber-400/60 bg-card shadow-lg">
            <div className="bg-gradient-to-br from-violet-800 via-fuchsia-700 to-orange-500 px-6 py-8 text-center text-white">
              <div className="mx-auto mb-3 grid size-16 place-items-center rounded-full bg-white/15 ring-2 ring-white/50">
                <Award className="size-8" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/80">Certificate of completion</p>
              <h1 className="mx-auto mt-2 max-w-md font-display text-2xl font-semibold leading-snug">{cert.title}</h1>
              <p className="mt-4 text-sm text-white/80">Awarded to</p>
              <p className="font-display text-3xl font-semibold">{cert.studentName}</p>
            </div>

            <div className="space-y-5 p-6">
              <p className="flex items-center justify-center gap-2 rounded-lg bg-success/10 px-4 py-3 text-sm font-semibold text-success">
                <BadgeCheck className="size-5" /> This certificate is genuine and was issued by {cert.issuerName}.
              </p>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Completed</dt>
                  <dd className="font-medium">{formatDate(cert.completionDate)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Issued</dt>
                  <dd className="font-medium">{formatDate(cert.issuedAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Certificate ID</dt>
                  <dd className="font-mono text-xs font-medium">{cert.publicId}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Issued by</dt>
                  <dd className="font-medium">{cert.issuerName}</dd>
                </div>
              </dl>
            </div>
          </article>
        ) : (
          <div className="mt-8 rounded-2xl border bg-card p-8 text-center shadow-sm">
            <div className="mx-auto mb-3 grid size-14 place-items-center rounded-full bg-destructive/10 text-destructive">
              <ShieldAlert className="size-7" />
            </div>
            <h1 className="font-display text-xl font-semibold">
              {cert?.revokedAt ? "This certificate has been revoked" : "We couldn't find that certificate"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {cert?.revokedAt
                ? "It is no longer valid. Contact the holder or Career Forge support if you think this is a mistake."
                : (
                  <>
                    No certificate matches the ID <code className="rounded bg-muted px-1">{publicId}</code>. Check the ID for typos and try
                    again.
                  </>
                )}
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button asChild variant="outline">
            <Link href="/verify">
              <ShieldCheck className="size-4" /> Verify another
            </Link>
          </Button>
          <Button asChild>
            <Link href="/courses">Earn your own certificate</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
