-- CreateEnum
CREATE TYPE "JobSourceType" AS ENUM ('GREENHOUSE', 'LEVER', 'ASHBY', 'WEWORKREMOTELY', 'ARBEITNOW', 'ADZUNA', 'JOOBLE', 'SITEMAP_LINKS');

-- AlterTable
ALTER TABLE "JobPost" ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "lastSeenAt" TIMESTAMP(3),
ADD COLUMN     "linkOnly" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sourceId" TEXT,
ADD COLUMN     "sourceName" TEXT;

-- CreateTable
CREATE TABLE "JobSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "JobSourceType" NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),
    "lastRunStatus" TEXT,
    "lastRunFound" INTEGER NOT NULL DEFAULT 0,
    "lastRunNew" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobSource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JobPost_sourceId_externalId_key" ON "JobPost"("sourceId", "externalId");

-- AddForeignKey
ALTER TABLE "JobPost" ADD CONSTRAINT "JobPost_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "JobSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

