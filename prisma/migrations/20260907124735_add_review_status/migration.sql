-- DropIndex
DROP INDEX "Review_courseId_idx";

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'VISIBLE',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Review" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "Review_courseId_status_idx" ON "Review"("courseId", "status");

