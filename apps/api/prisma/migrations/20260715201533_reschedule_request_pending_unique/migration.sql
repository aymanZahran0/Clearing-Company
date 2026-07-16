-- data-model.md §1: at most one PENDING RescheduleRequest per booking at a time.
-- Prisma schema has no partial-unique-index syntax, so this is hand-written.
CREATE UNIQUE INDEX "RescheduleRequest_bookingId_pending_unique"
  ON "RescheduleRequest" ("bookingId")
  WHERE "status" = 'PENDING';
