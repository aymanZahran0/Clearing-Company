import ExcelJS from "exceljs";
import { prisma } from "../../lib/prisma.js";
import { recordAuditEntry } from "../../middleware/auditLogger.js";

const ACTIVE_STATUSES = ["CONFIRMED", "RESCHEDULED", "IN_PROGRESS"] as const;

const BOOKING_STATUS_LABELS_AR: Record<string, string> = {
  DRAFT: "مسودة",
  PENDING: "قيد الانتظار",
  CONFIRMED: "مؤكد",
  RESCHEDULED: "تمت إعادة الجدولة",
  IN_PROGRESS: "قيد التنفيذ",
  COMPLETED: "مكتمل",
  CANCELLED: "ملغي",
  REJECTED: "مرفوض",
  COMPLAINT_OPENED: "توجد شكوى مفتوحة",
};

// T164: powers the finalized Admin dashboard (today's bookings, unscheduled
// confirmed, overdue).
export async function getOperationsSummary() {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setUTCHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setUTCHours(23, 59, 59, 999);

  const [todaysBookings, unscheduledConfirmed, overdueBookings, groupedStatuses] = await Promise.all([
    prisma.booking.count({
      where: { scheduledStartAt: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.booking.count({ where: { status: "CONFIRMED", scheduledStartAt: null } }),
    prisma.booking.count({
      where: { status: { in: [...ACTIVE_STATUSES] }, scheduledStartAt: { lt: now } },
    }),
    prisma.booking.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const statusCounts = Object.fromEntries(
    groupedStatuses.map((entry) => [entry.status, entry._count._all])
  );

  return { todaysBookings, unscheduledConfirmed, overdueBookings, statusCounts };
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

// Booking amounts are stored as integer minor units (halalas); every
// display surface (formatters.ts on the web side too) divides by 100.
const MINOR_UNITS_PER_CURRENCY_UNIT = 100;

// FR-073/FR-074: PII fields (phone, full address, internal notes) are
// excluded by default per data-model.md's PII classification; including
// them requires an explicit opt-in and is always audit-logged regardless
// of which way `includePii` was set, since every export is a sensitive
// action (FR-004).
export async function exportBookingsWorkbook(
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

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Nuqaa Asir";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("الحجوزات", {
    views: [{ rightToLeft: true, state: "frozen", ySplit: 1 }],
  });

  sheet.columns = [
    { header: "رقم المرجع", key: "referenceNumber", width: 22 },
    { header: "الحالة", key: "status", width: 22 },
    { header: "اسم العميل", key: "customerName", width: 24 },
    { header: "الخدمة", key: "serviceName", width: 26 },
    { header: "الموعد المجدول", key: "scheduledStartAt", width: 20 },
    { header: "الإجمالي (ر.س)", key: "total", width: 14 },
    { header: "تاريخ الإنشاء", key: "createdAt", width: 20 },
    ...(filters.includePii
      ? [
          { header: "رقم الهاتف", key: "phone", width: 16 },
          { header: "المدينة", key: "city", width: 14 },
          { header: "الحي", key: "neighborhood", width: 18 },
          { header: "الشارع", key: "street", width: 22 },
        ]
      : []),
  ];

  const headerRow = sheet.getRow(1);
  headerRow.height = 22;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF00375B" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  for (const booking of bookings) {
    sheet.addRow({
      referenceNumber: booking.referenceNumber,
      status: BOOKING_STATUS_LABELS_AR[booking.status] ?? booking.status,
      customerName: booking.customer.user.fullName,
      serviceName: booking.items[0]?.service.nameAr ?? "",
      scheduledStartAt: booking.scheduledStartAt ?? null,
      total: booking.totalSnapshot != null ? booking.totalSnapshot / MINOR_UNITS_PER_CURRENCY_UNIT : null,
      createdAt: booking.createdAt,
      ...(filters.includePii
        ? {
            phone: booking.customer.user.phoneNormalized ?? "",
            city: booking.address.city,
            neighborhood: booking.address.neighborhood,
            street: booking.address.street ?? "",
          }
        : {}),
    });
  }

  sheet.getColumn("scheduledStartAt").numFmt = "yyyy-mm-dd hh:mm";
  sheet.getColumn("createdAt").numFmt = "yyyy-mm-dd hh:mm";
  sheet.getColumn("total").numFmt = "#,##0.00";

  await recordAuditEntry({
    actorUserId: actor.actorUserId,
    action: "EXPORT_GENERATED",
    entityType: "Booking",
    entityId: "bulk-export",
    afterSnapshot: { rowCount: bookings.length, includePii: filters.includePii },
    ipAddress: actor.ipAddress,
    userAgent: actor.userAgent,
  });

  return workbook.xlsx.writeBuffer();
}
