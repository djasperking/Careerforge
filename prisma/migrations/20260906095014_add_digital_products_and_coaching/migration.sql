-- CreateEnum
CREATE TYPE "CoachingBookingStatus" AS ENUM ('PENDING_PAYMENT', 'REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ProductType" ADD VALUE 'DIGITAL_PRODUCT';
ALTER TYPE "ProductType" ADD VALUE 'COACHING';

-- CreateTable
CREATE TABLE "DigitalProduct" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "coverImageUrl" TEXT,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL DEFAULT 0,
    "priceCents" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "reviewStatus" "CourseReviewStatus" NOT NULL DEFAULT 'DRAFT',
    "reviewNote" TEXT,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "discountPercent" INTEGER,
    "discountEndsAt" TIMESTAMP(3),
    "revenueSharePercent" INTEGER NOT NULL DEFAULT 70,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DigitalProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DigitalProductPurchase" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DigitalProductPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachingOffer" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "coverImageUrl" TEXT,
    "durationMinutes" INTEGER NOT NULL DEFAULT 45,
    "priceCents" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "reviewStatus" "CourseReviewStatus" NOT NULL DEFAULT 'DRAFT',
    "reviewNote" TEXT,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "revenueSharePercent" INTEGER NOT NULL DEFAULT 80,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachingOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachingBooking" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "transactionId" TEXT,
    "status" "CoachingBookingStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "preferredTimes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "scheduledAt" TIMESTAMP(3),
    "meetingUrl" TEXT,
    "note" TEXT,
    "coachNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachingBooking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DigitalProduct_slug_key" ON "DigitalProduct"("slug");

-- CreateIndex
CREATE INDEX "DigitalProduct_sellerId_idx" ON "DigitalProduct"("sellerId");

-- CreateIndex
CREATE INDEX "DigitalProduct_reviewStatus_idx" ON "DigitalProduct"("reviewStatus");

-- CreateIndex
CREATE INDEX "DigitalProduct_status_idx" ON "DigitalProduct"("status");

-- CreateIndex
CREATE INDEX "DigitalProductPurchase_userId_idx" ON "DigitalProductPurchase"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DigitalProductPurchase_productId_userId_key" ON "DigitalProductPurchase"("productId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "CoachingOffer_slug_key" ON "CoachingOffer"("slug");

-- CreateIndex
CREATE INDEX "CoachingOffer_coachId_idx" ON "CoachingOffer"("coachId");

-- CreateIndex
CREATE INDEX "CoachingOffer_reviewStatus_idx" ON "CoachingOffer"("reviewStatus");

-- CreateIndex
CREATE INDEX "CoachingBooking_offerId_idx" ON "CoachingBooking"("offerId");

-- CreateIndex
CREATE INDEX "CoachingBooking_userId_idx" ON "CoachingBooking"("userId");

-- AddForeignKey
ALTER TABLE "DigitalProduct" ADD CONSTRAINT "DigitalProduct_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalProduct" ADD CONSTRAINT "DigitalProduct_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalProductPurchase" ADD CONSTRAINT "DigitalProductPurchase_productId_fkey" FOREIGN KEY ("productId") REFERENCES "DigitalProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalProductPurchase" ADD CONSTRAINT "DigitalProductPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachingOffer" ADD CONSTRAINT "CoachingOffer_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachingOffer" ADD CONSTRAINT "CoachingOffer_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachingBooking" ADD CONSTRAINT "CoachingBooking_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "CoachingOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachingBooking" ADD CONSTRAINT "CoachingBooking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
