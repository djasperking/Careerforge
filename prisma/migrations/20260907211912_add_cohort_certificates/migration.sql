-- Per-cohort certificates: link certs to a cohort, attendance gate, issued-at stamp.
ALTER TABLE "Certificate" ADD COLUMN "cohortId" TEXT;
CREATE INDEX "Certificate_cohortId_idx" ON "Certificate"("cohortId");
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "Cohort"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Cohort" ADD COLUMN "minAttendancePercent" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Cohort" ADD COLUMN "certificatesIssuedAt" TIMESTAMP(3);
