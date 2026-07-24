import { prisma } from "../../lib/prisma.js";
import { recordAuditEntry } from "../../middleware/auditLogger.js";

const ACTIVE_STATUSES = ["CONFIRMED", "RESCHEDULED", "IN_PROGRESS"] as const;

// T164: powers the finalized Admin dashboard (today's bookings, unscheduled
// confirmed, overdue).
export async function getOperationsSummary() {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setUTCHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setUTCHours(23, 59, 59, 999);

  const [todaysBookings, unscheduledConfirmed, overdueBookings] = await Promise.all([
    prisma.booking.count({
      where: { scheduledStartAt: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.booking.count({ where: { status: "CONFIRMED", scheduledStartAt: null } }),
    prisma.booking.count({
      where: { status: { in: [...ACTIVE_STATUSES] }, scheduledStartAt: { lt: now } },
    }),
  ]);

  return { todaysBookings, unscheduledConfirmed, overdueBookings };
}

export async function getRevenueReport(from?: Date, to?: Date) {
  const where = {
    status: "COMPLETED" as const,
    ...(from || to ? { completedAt: { gte: from, lte: to } } : {}),
  };

  const bookings = await prisma.booking.findMany({
    where,
    select: { totalSnapshot: true, taxSnapshot: true, discountSnapshot: true, completedAt: true },
  });

  const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalSnapshot ?? 0), 0);
  const totalTax = bookings.reduce((sum, b) => sum + b.taxSnapshot, 0);
  const totalDiscount = bookings.reduce((sum, b) => sum + b.discountSnapshot, 0);

  const payments = await prisma.payment.findMany({
    where: {
      status: "PAID",
      ...(from || to ? { paidAt: { gte: from, lte: to } } : {}),
    },
    select: { amount: true },
  });
  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

  return {
    completedBookings: bookings.length,
    totalRevenue,
    totalTax,
    totalDiscount,
    totalCollected,
  };
}

export async function getServicesReport(from?: Date, to?: Date) {
  const items = await prisma.bookingItem.findMany({
    where: {
      addOnId: null,
      booking: {
        status: "COMPLETED",
        ...(from || to ? { completedAt: { gte: from, lte: to } } : {}),
      },
    },
    include: { service: { select: { nameAr: true } } },
  });

  const byService = new Map<string, { nameAr: string; nameEn: string; count: number; revenue: number }>();
  for (const item of items) {
    const key = item.serviceId;
    const existing = byService.get(key) ?? {
      nameAr: item.service.nameAr,
      nameEn: item.service.nameAr,
      count: 0,
      revenue: 0,
    };
    existing.count += 1;
    existing.revenue += item.totalSnapshot;
    byService.set(key, existing);
  }

  return Array.from(byService.values());
}

export async function getQualityReport() {
  const [reviews, issuesByStatus] = await Promise.all([
    prisma.review.aggregate({ _avg: { rating: true }, _count: true }),
    prisma.qualityIssue.groupBy({ by: ["status"], _count: true }),
  ]);

  return {
    averageRating: reviews._avg.rating ?? null,
    reviewCount: reviews._count,
    issuesByStatus: issuesByStatus.map((row) => ({ status: row.status, count: row._count })),
  };
}

// FR-073/FR-074: PII fields (phone, full address, internal notes) are
// excluded by default per data-model.md's PII classification; including
// them requires an explicit opt-in and is always audit-logged regardless
// of which way `includePii` was set, since every export is a sensitive
// action (FR-004).
export async function exportBookingsCsv(
  filters: { from?: Date; to?: Date; includePii: boolean },
  actor: { actorUserId: string; ipAddress?: string; userAgent?: string }
) {
  const bookings = await prisma.booking.findMany({
    where: filters.from || filters.to ? { createdAt: { gte: filters.from, lte: filters.to } } : {},
    include: {
      customer: { include: { user: true } },
      address: true,
      items: { include: { service: true }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  const headers = [
    "referenceNumber",
    "status",
    "customerName",
    "serviceName",
    "scheduledStartAt",
    "totalSnapshot",
    "currency",
    "createdAt",
    ...(filters.includePii ? ["phone", "city", "neighborhood", "street"] : []),
  ];

  const rows = bookings.map((booking) => {
    const base = [
      booking.referenceNumber,
      booking.status,
      booking.customer.user.fullName,
      booking.items[0]?.service.nameAr ?? "",
      booking.scheduledStartAt?.toISOString() ?? "",
      String(booking.totalSnapshot ?? ""),
      booking.currency,
      booking.createdAt.toISOString(),
    ];
    if (filters.includePii) {
      base.push(
        booking.customer.user.phoneNormalized ?? "",
        booking.address.city,
        booking.address.neighborhood,
        booking.address.street ?? ""
      );
    }
    return base;
  });

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  await recordAuditEntry({
    actorUserId: actor.actorUserId,
    action: "EXPORT_GENERATED",
    entityType: "Booking",
    entityId: "bulk-export",
    afterSnapshot: { rowCount: bookings.length, includePii: filters.includePii },
    ipAddress: actor.ipAddress,
    userAgent: actor.userAgent,
  });

  return csv;
}
