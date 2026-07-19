import { ApiError } from "@nuqaa-asir/shared";
import { prisma } from "../../lib/prisma.js";
import { recordAuditEntry } from "../../middleware/auditLogger.js";
import type { PaymentInput } from "./schema.js";

async function assertBookingExists(bookingId: string) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) {
    throw new ApiError(404, "NOT_FOUND", "Booking not found");
  }
  return booking;
}

// FR-060: Admin manually records a payment. FR-064: this is the only
// payment path — no online gateway exists anywhere in this API surface.
export async function recordPayment(
  bookingId: string,
  input: PaymentInput,
  actor: { actorUserId: string; ipAddress?: string; userAgent?: string }
) {
  const booking = await assertBookingExists(bookingId);
  if (booking.status === "REJECTED" || booking.status === "CANCELLED") {
    throw new ApiError(409, "CONFLICT", "Cannot record a payment for a rejected or cancelled booking");
  }

  const payment = await prisma.payment.create({
    data: {
      bookingId,
      method: input.method,
      status: input.status,
      amount: input.amount,
      reference: input.reference,
      paidAt: input.paidAt ?? new Date(),
      recordedByUserId: actor.actorUserId,
    },
  });

  await recordAuditEntry({
    actorUserId: actor.actorUserId,
    action: "PAYMENT_RECORDED",
    entityType: "Booking",
    entityId: bookingId,
    afterSnapshot: { paymentId: payment.id, method: payment.method, amount: payment.amount },
    ipAddress: actor.ipAddress,
    userAgent: actor.userAgent,
  });

  return payment;
}

export async function listPaymentsForBooking(bookingId: string) {
  await assertBookingExists(bookingId);
  return prisma.payment.findMany({ where: { bookingId }, orderBy: { createdAt: "asc" } });
}

// FR-063: revenue is based on snapshot + recorded payments only.
export async function getPaymentStatus(bookingId: string): Promise<
  "UNPAID" | "PARTIALLY_PAID" | "PAID"
> {
  const booking = await assertBookingExists(bookingId);
  const payments = await prisma.payment.findMany({
    where: { bookingId, status: { in: ["PAID"] } },
  });
  const paidTotal = payments.reduce((sum, p) => sum + p.amount, 0);

  if (booking.totalSnapshot == null || paidTotal === 0) return "UNPAID";
  if (paidTotal >= booking.totalSnapshot) return "PAID";
  return "PARTIALLY_PAID";
}

// FR-064: non-fiscal internal receipt, generated on demand from the
// booking's locked price snapshot — never a ZATCA-compliant e-invoice.
export async function getOrCreateInvoice(bookingId: string) {
  const booking = await assertBookingExists(bookingId);
  const existing = await prisma.invoice.findUnique({ where: { bookingId } });
  if (existing) return existing;

  const invoiceNumber = `INV-${booking.referenceNumber}`;
  return prisma.invoice.create({
    data: {
      bookingId,
      invoiceNumber,
      subtotal: booking.subtotalSnapshot ?? 0,
      discount: booking.discountSnapshot,
      travelFee: booking.travelFeeSnapshot,
      tax: booking.taxSnapshot,
      total: booking.totalSnapshot ?? 0,
    },
  });
}
