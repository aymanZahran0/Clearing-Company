-- CreateEnum
CREATE TYPE "RescheduleRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'AUTO_REJECTED');

-- CreateEnum
CREATE TYPE "JobName" AS ENUM ('EXPIRE_STALE_QUOTES', 'FLAG_OVERDUE_BOOKINGS', 'GENERATE_SUBSCRIPTION_OCCURRENCES');

-- CreateEnum
CREATE TYPE "JobRunStatus" AS ENUM ('SUCCESS', 'FAILURE', 'SKIPPED_LOCKED');

-- CreateTable
CREATE TABLE "RescheduleRequest" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "requestedByUserId" TEXT NOT NULL,
    "requestedStartAt" TIMESTAMP(3) NOT NULL,
    "requestedTimeSlotId" TEXT,
    "status" "RescheduleRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "decidedByUserId" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RescheduleRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobRun" (
    "id" TEXT NOT NULL,
    "jobName" "JobName" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "status" "JobRunStatus" NOT NULL,
    "detail" JSONB,
    "failureReason" TEXT,

    CONSTRAINT "JobRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RescheduleRequest_bookingId_idx" ON "RescheduleRequest"("bookingId");

-- CreateIndex
CREATE INDEX "RescheduleRequest_status_idx" ON "RescheduleRequest"("status");

-- CreateIndex
CREATE INDEX "JobRun_jobName_idx" ON "JobRun"("jobName");

-- CreateIndex
CREATE INDEX "JobRun_status_idx" ON "JobRun"("status");

-- CreateIndex
CREATE INDEX "JobRun_startedAt_idx" ON "JobRun"("startedAt");

-- AddForeignKey
ALTER TABLE "RescheduleRequest" ADD CONSTRAINT "RescheduleRequest_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RescheduleRequest" ADD CONSTRAINT "RescheduleRequest_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RescheduleRequest" ADD CONSTRAINT "RescheduleRequest_requestedTimeSlotId_fkey" FOREIGN KEY ("requestedTimeSlotId") REFERENCES "TimeSlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RescheduleRequest" ADD CONSTRAINT "RescheduleRequest_decidedByUserId_fkey" FOREIGN KEY ("decidedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
