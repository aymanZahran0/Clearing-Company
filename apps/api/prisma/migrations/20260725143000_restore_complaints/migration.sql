CREATE TYPE "QualityIssueSource" AS ENUM ('REVIEW', 'COMPLAINT', 'CHECKLIST_FAILURE');
CREATE TYPE "QualityIssueSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE "QualityIssueStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED');

CREATE TABLE "QualityIssue" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "source" "QualityIssueSource" NOT NULL,
  "category" TEXT NOT NULL,
  "severity" "QualityIssueSeverity" NOT NULL DEFAULT 'MEDIUM',
  "description" TEXT NOT NULL,
  "status" "QualityIssueStatus" NOT NULL DEFAULT 'OPEN',
  "ownerUserId" TEXT,
  "resolution" TEXT,
  "reworkBookingId" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "QualityIssue_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "QualityIssue_reworkBookingId_key" ON "QualityIssue"("reworkBookingId");
CREATE INDEX "QualityIssue_bookingId_idx" ON "QualityIssue"("bookingId");
CREATE INDEX "QualityIssue_status_idx" ON "QualityIssue"("status");
CREATE UNIQUE INDEX "QualityIssue_one_customer_issue_per_booking"
  ON "QualityIssue" ("bookingId")
  WHERE "source" IN ('REVIEW', 'COMPLAINT');

ALTER TABLE "QualityIssue"
  ADD CONSTRAINT "QualityIssue_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "Booking"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
