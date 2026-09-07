-- AlterTable
ALTER TABLE "InstructorProfile" ADD COLUMN     "payoutBankCode" TEXT,
ADD COLUMN     "payoutRecipientCode" TEXT;

-- AlterTable
ALTER TABLE "Payout" ADD COLUMN     "bankCode" TEXT,
ADD COLUMN     "transferCode" TEXT,
ADD COLUMN     "transferState" TEXT;

