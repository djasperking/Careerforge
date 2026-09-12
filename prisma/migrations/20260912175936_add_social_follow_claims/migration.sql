-- CreateEnum
CREATE TYPE "SocialPlatform" AS ENUM ('FACEBOOK', 'INSTAGRAM', 'TWITTER', 'LINKEDIN');

-- CreateTable
CREATE TABLE "SocialFollowClaim" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "creditedCents" INTEGER NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialFollowClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SocialFollowClaim_userId_idx" ON "SocialFollowClaim"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SocialFollowClaim_userId_platform_key" ON "SocialFollowClaim"("userId", "platform");

-- AddForeignKey
ALTER TABLE "SocialFollowClaim" ADD CONSTRAINT "SocialFollowClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
