-- AlterTable
ALTER TABLE "User" ADD COLUMN     "jobAlertsLastSentAt" TIMESTAMP(3),
ADD COLUMN     "jobAlertsOptOut" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "jobAlertsToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_jobAlertsToken_key" ON "User"("jobAlertsToken");
