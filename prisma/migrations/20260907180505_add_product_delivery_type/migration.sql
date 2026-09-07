-- Digital products can now deliver a downloadable file or an external video link.
ALTER TABLE "DigitalProduct" ALTER COLUMN "fileUrl" SET DEFAULT '';
ALTER TABLE "DigitalProduct" ALTER COLUMN "fileName" SET DEFAULT '';
ALTER TABLE "DigitalProduct" ADD COLUMN "deliveryType" TEXT NOT NULL DEFAULT 'FILE';
ALTER TABLE "DigitalProduct" ADD COLUMN "videoUrl" TEXT;
ALTER TABLE "DigitalProduct" ADD COLUMN "videoProvider" TEXT;
ALTER TABLE "DigitalProduct" ADD COLUMN "videoAssetId" TEXT;
ALTER TABLE "DigitalProduct" ADD COLUMN "videoDurationSec" INTEGER;
