-- CreateEnum
CREATE TYPE "JobOrigin" AS ENUM ('MANUAL', 'CLIP', 'CRAWLER');

-- AlterTable
ALTER TABLE "JobPost" ADD COLUMN     "origin" "JobOrigin" NOT NULL DEFAULT 'MANUAL';


-- Backfill: jobs the browser extension clipped, and jobs the crawler imported.
UPDATE "JobPost" SET "origin" = 'CLIP'
  WHERE "sourceId" IN (SELECT "id" FROM "JobSource" WHERE "type" = 'BROWSER_CLIP');
UPDATE "JobPost" SET "origin" = 'CRAWLER'
  WHERE "sourceId" IS NOT NULL AND "origin" = 'MANUAL';
