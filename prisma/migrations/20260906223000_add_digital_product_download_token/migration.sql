-- AlterTable
ALTER TABLE "DigitalProductPurchase" ADD COLUMN     "downloadToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "DigitalProductPurchase_downloadToken_key" ON "DigitalProductPurchase"("downloadToken");
