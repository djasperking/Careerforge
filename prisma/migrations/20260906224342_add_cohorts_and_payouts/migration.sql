-- CreateEnum
CREATE TYPE "CohortStatus" AS ENUM ('DRAFT', 'OPEN', 'RUNNING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EarningStatus" AS ENUM ('PENDING', 'AVAILABLE', 'REVERSED', 'PAID_OUT');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('REQUESTED', 'APPROVED', 'PAID', 'REJECTED');

-- AlterTable
ALTER TABLE "InstructorProfile" ADD COLUMN     "payoutAccountName" TEXT,
ADD COLUMN     "payoutAccountNumber" TEXT,
ADD COLUMN     "payoutBankName" TEXT;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "cohortId" TEXT;

-- CreateTable
CREATE TABLE "Cohort" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "enrollByDate" TIMESTAMP(3),
    "capacity" INTEGER NOT NULL DEFAULT 0,
    "priceCents" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "meetingUrl" TEXT,
    "scheduleNote" TEXT,
    "status" "CohortStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cohort_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CohortEnrollment" (
    "id" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "enrollmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CohortEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CohortSession" (
    "id" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 60,
    "meetingUrl" TEXT,
    "note" TEXT,

    CONSTRAINT "CohortSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstructorEarning" (
    "id" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "productType" "ProductType" NOT NULL,
    "productId" TEXT,
    "description" TEXT,
    "grossCents" INTEGER NOT NULL,
    "feeCents" INTEGER NOT NULL,
    "netCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "sharePercent" INTEGER NOT NULL,
    "status" "EarningStatus" NOT NULL DEFAULT 'PENDING',
    "availableAt" TIMESTAMP(3) NOT NULL,
    "payoutId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstructorEarning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" "PayoutStatus" NOT NULL DEFAULT 'REQUESTED',
    "bankName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "note" TEXT,
    "adminNote" TEXT,
    "reference" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    "decidedById" TEXT,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Cohort_courseId_idx" ON "Cohort"("courseId");

-- CreateIndex
CREATE INDEX "Cohort_status_idx" ON "Cohort"("status");

-- CreateIndex
CREATE INDEX "CohortEnrollment_userId_idx" ON "CohortEnrollment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CohortEnrollment_cohortId_userId_key" ON "CohortEnrollment"("cohortId", "userId");

-- CreateIndex
CREATE INDEX "CohortSession_cohortId_idx" ON "CohortSession"("cohortId");

-- CreateIndex
CREATE UNIQUE INDEX "InstructorEarning_transactionId_key" ON "InstructorEarning"("transactionId");

-- CreateIndex
CREATE INDEX "InstructorEarning_instructorId_status_idx" ON "InstructorEarning"("instructorId", "status");

-- CreateIndex
CREATE INDEX "InstructorEarning_payoutId_idx" ON "InstructorEarning"("payoutId");

-- CreateIndex
CREATE INDEX "Payout_instructorId_idx" ON "Payout"("instructorId");

-- CreateIndex
CREATE INDEX "Payout_status_idx" ON "Payout"("status");

-- AddForeignKey
ALTER TABLE "Cohort" ADD CONSTRAINT "Cohort_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CohortEnrollment" ADD CONSTRAINT "CohortEnrollment_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "Cohort"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CohortEnrollment" ADD CONSTRAINT "CohortEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CohortEnrollment" ADD CONSTRAINT "CohortEnrollment_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CohortSession" ADD CONSTRAINT "CohortSession_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "Cohort"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstructorEarning" ADD CONSTRAINT "InstructorEarning_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstructorEarning" ADD CONSTRAINT "InstructorEarning_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstructorEarning" ADD CONSTRAINT "InstructorEarning_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "Payout"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

