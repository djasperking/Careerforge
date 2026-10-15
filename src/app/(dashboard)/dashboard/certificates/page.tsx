import Link from "next/link";
import { Award, BadgeCheck, Download, GraduationCap, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { appUrl } from "@/lib/email";
import { cn, formatDate } from "@/lib/utils";
import { LearningTabs } from "../learning-tabs";
import { ShareMenu } from "./share-menu";

export const metadata = { title: "Certificates" };

export default async function CertificatesPage() {
  const user = await requireUser();
  const certificates = await db.certificate.findMany({
    where: { userId: user.id },
    orderBy: { issuedAt: "desc" },
  });
  const valid = certificates.filter((c) => !c.revokedAt);

  return (
    <div>
      <PageHeader title="Learning" description="Certificates you've earned." />
      <LearningTabs active="certificates" />

      {certificates.length === 0 ? (
        <div className="rounded-2xl border bg-gradient-to-br from-amber-500/10 via-primary/5 to-transparent p-8 text-center sm:p-12">
          <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-amber-500/15 text-amber-600">
            <Award className="size-8" />
          </div>
          <h2 className="font-display text-xl font-semibold">Your first certificate is waiting</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Finish every lesson in a course to earn a certificate with a public link you can put on your CV and LinkedIn.
          </p>
          <Button asChild className="mt-5">
            <Link href="/dashboard/courses">
              <GraduationCap className="size-4" /> Go to My Learning
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <p className="mb-5 flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="size-4 text-success" />
            You have <b className="text-foreground">{valid.length}</b> verified certificate{valid.length === 1 ? "" : "s"}. Anyone can check
            them with the public link.
          </p>

          <div className="grid gap-6 lg:grid-cols-2">
            {certificates.map((c) => {
              const revoked = Boolean(c.revokedAt);
              const verifyUrl = appUrl(`/verify/${c.publicId}`);
              return (
                <article
                  key={c.id}
                  className={cn(
                    "overflow-hidden rounded-2xl border-2 bg-card shadow-sm",
                    revoked ? "border-destructive/40 opacity-70" : "border-amber-400/60",
                  )}
                >
                  <div className="relative bg-gradient-to-br from-violet-800 via-fuchsia-700 to-orange-500 px-6 py-7 text-center text-white">
                    <div className="mx-auto mb-3 grid size-14 place-items-center rounded-full bg-white/15 ring-2 ring-white/50">
                      <Award className="size-7" />
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/80">Certificate of completion</p>
                    <h2 className="mx-auto mt-2 max-w-md font-display text-xl font-semibold leading-snug">{c.title}</h2>
                    <p className="mt-3 text-sm text-white/80">Awarded to</p>
                    <p className="font-display text-2xl font-semibold">{c.studentName}</p>
                    {revoked ? (
                      <span className="absolute right-3 top-3 rounded-full bg-destructive px-3 py-1 text-xs font-bold">REVOKED</span>
                    ) : (
                      <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
                        <BadgeCheck className="size-3.5" /> Verified
                      </span>
                    )}
                  </div>

                  <div className="space-y-4 p-5">
                    <dl className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <dt className="text-xs text-muted-foreground">Issued</dt>
                        <dd className="font-medium">{formatDate(c.issuedAt)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">Certificate ID</dt>
                        <dd className="font-mono text-xs font-medium">{c.publicId}</dd>
                      </div>
                    </dl>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button asChild size="sm">
                        <a href={`/api/certificates/${c.id}/pdf`} target="_blank" rel="noreferrer">
                          <Download className="size-4" /> Download PDF
                        </a>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/verify/${c.publicId}`}>
                          <ShieldCheck className="size-4" /> Verification page
                        </Link>
                      </Button>
                      {!revoked ? <ShareMenu url={verifyUrl} title={c.title} /> : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
