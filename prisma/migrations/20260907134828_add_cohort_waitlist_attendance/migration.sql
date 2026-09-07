-- CreateTable
CREATE TABLE "CohortWaitlist" (
    "id" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "notifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CohortWaitlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionAttendance" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "present" BOOLEAN NOT NULL DEFAULT true,
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CohortWaitlist_cohortId_idx" ON "CohortWaitlist"("cohortId");

-- CreateIndex
CREATE UNIQUE INDEX "CohortWaitlist_cohortId_userId_key" ON "CohortWaitlist"("cohortId", "userId");

-- CreateIndex
CREATE INDEX "SessionAttendance_userId_idx" ON "SessionAttendance"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionAttendance_sessionId_userId_key" ON "SessionAttendance"("sessionId", "userId");

-- AddForeignKey
ALTER TABLE "CohortWaitlist" ADD CONSTRAINT "CohortWaitlist_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "Cohort"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CohortWaitlist" ADD CONSTRAINT "CohortWaitlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionAttendance" ADD CONSTRAINT "SessionAttendance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CohortSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionAttendance" ADD CONSTRAINT "SessionAttendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

