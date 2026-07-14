import { prisma } from "../lib/prisma.js";
import { recordAuditEntry } from "../middleware/auditLogger.js";

const ACTIVE_STATUSES = ["CONFIRMED", "RESCHEDULED", "IN_PROGRESS"] as const;

// There is no OVERDUE `BookingStatus` value (research.md R5 keeps the enum
// to the 9 top-level values) — "flagging" means writing one `AuditLog`
// entry per overdue booking so it surfaces in the Admin audit trail /
// alerting, without touching `Booking.status` itself. Idempotent per
// calendar day: a booking already flagged today is skipped.
export async function flagOverdueBookings(now: Date = new Date()) {
  const todayStart = new Date(now);
  todayStart.setUTCHours(0, 0, 0, 0);

  const overdueBookings = await prisma.booking.findMany({
    where: { status: { in: [...ACTIVE_STATUSES] }, scheduledStartAt: { lt: now } },
  });

  let flagged = 0;
  for (const booking of overdueBookings) {
    const alreadyFlaggedToday = await prisma.auditLog.findFirst({
      where: {
        entityType: "Booking",
        entityId: booking.id,
        action: "BOOKING_OVERDUE_FLAGGED",
        createdAt: { gte: todayStart },
      },
    });
    if (alreadyFlaggedToday) continue;

    await recordAuditEntry({
      actorUserId: booking.createdByUserId ?? booking.customerId,
      action: "BOOKING_OVERDUE_FLAGGED",
      entityType: "Booking",
      entityId: booking.id,
      afterSnapshot: { status: booking.status, scheduledStartAt: booking.scheduledStartAt },
    });
    flagged += 1;
  }

  return { flagged };
}
