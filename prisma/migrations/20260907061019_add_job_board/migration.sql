-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE', 'INTERNSHIP');

-- CreateEnum
CREATE TYPE "JobLocationType" AS ENUM ('REMOTE', 'HYBRID', 'ONSITE');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED');

-- CreateTable
CREATE TABLE "JobPost" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "companyLogoUrl" TEXT,
    "location" TEXT,
    "locationType" "JobLocationType" NOT NULL DEFAULT 'REMOTE',
    "type" "JobType" NOT NULL DEFAULT 'FULL_TIME',
    "category" TEXT,
    "salaryText" TEXT,
    "description" TEXT NOT NULL,
    "howToApply" TEXT,
    "applyUrl" TEXT NOT NULL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "status" "JobStatus" NOT NULL DEFAULT 'DRAFT',
    "postedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobApplyClick" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "userId" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobApplyClick_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JobPost_slug_key" ON "JobPost"("slug");

-- CreateIndex
CREATE INDEX "JobPost_status_idx" ON "JobPost"("status");

-- CreateIndex
CREATE INDEX "JobPost_category_idx" ON "JobPost"("category");

-- CreateIndex
CREATE INDEX "JobPost_featured_idx" ON "JobPost"("featured");

-- CreateIndex
CREATE INDEX "JobApplyClick_jobId_idx" ON "JobApplyClick"("jobId");

-- AddForeignKey
ALTER TABLE "JobPost" ADD CONSTRAINT "JobPost_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplyClick" ADD CONSTRAINT "JobApplyClick_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "JobPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

