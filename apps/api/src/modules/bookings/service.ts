import { ApiError } from "@nuqaa-asir/shared";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { generateBookingReference, generateVerificationToken } from "../../lib/bookingReference.js";
import { assertTransition } from "../../lib/bookingStateMachine.js";
import { recordAuditEntry } from "../../middleware/auditLogger.js";
import { createInvitedCustomer } from "../customers/service.js";
import { notify } from "../notifications/service.js";
import { autoRejectPendingRequestsForBooking } from "../reschedule-requests/service.js";
import type {
  AdminBookingCreateInput,
  BookingCreateInput,
  ScheduleBookingInput,
} from "./schema.js";

interface ActorContext {
  actorUserId: string;
  ipAddress?: string;
  userAgent?: string;
}

interface CreateBookingOptions {
  source: "WEB" | "ADMIN_PHONE";
  createdByUserId?: string;
  idempotencyKey?: string;
}

async function resolveCustomerWhatsAppRecipient(customerId: string): Promise<string> {
  const profile = await prisma.customerProfile.findUnique({
    where: { userId: customerId },
    select: { user: { select: { phoneNormalized: true } } },
  });
  return profile?.user.phoneNormalized ?? "";
}

async function resolveCustomerId(
  input: AdminBookingCreateInput,
  fallbackCustomerId: string | undefined
): Promise<string> {
  if (fallbackCustomerId) return fallbackCustomerId;
  if (input.customerId) return input.customerId;

  if (input.newCustomer) {
    const user = await createInvitedCustomer(input.newCustomer);
    return user.id;
  }

  throw new ApiError(422, "VALIDATION_ERROR", "customerId or newCustomer is required");
}

export async function createBooking(
  input: BookingCreateInput | AdminBookingCreateInput,
  requestingCustomerId: string | undefined,
  options: CreateBookingOptions
) {
  if (options.idempotencyKey) {
    const existing = await prisma.booking.findUnique({
      where: { idempotencyKey: options.idempotencyKey },
    });
    if (existing) return existing; // FR-013: safe to retry
  }

  const customerId = await resolveCustomerId(input as AdminBookingCreateInput, requestingCustomerId);

  const quote = await prisma.quote.findUnique({ where: { id: input.quoteId } });
  if (!quote) {
    throw new ApiError(404, "NOT_FOUND", "Quote not found");
  }
  if (quote.status !== "ACTIVE" || quote.expiresAt < new Date()) {
    throw new ApiError(409, "CONFLICT", "This quote has expired; request a new estimate");
  }

  const address = await prisma.customerAddress.findUnique({ where: { id: input.addressId } });
  if (!address || address.customerId !== customerId) {
    throw new ApiError(404, "NOT_FOUND", "Address not found");
  }

  const service = await prisma.service.findUniqueOrThrow({ where: { id: quote.serviceId } });
  const addOns = quote.addOnIds.length
    ? await prisma.serviceAddOn.findMany({ where: { id: { in: quote.addOnIds } } })
    : [];

  const breakdown = quote.priceBreakdownJson as unknown as {
    subtotal: number;
    addOnsTotal: number;
    discount: number;
    travelFee: number;
    tax: number;
    total: number;
  };

  const booking = await prisma.$transaction(async (tx) => {
    const created = await tx.booking.create({
      data: {
        referenceNumber: generateBookingReference(),
        verificationToken: generateVerificationToken(),
        customerId,
        addressId: input.addressId,
        quoteId: quote.id,
        source: options.source,
        status: "DRAFT",
        propertyType: input.propertyType,
        propertyDetailsJson: input.propertyDetails as Prisma.InputJsonValue,
        customerNotes: input.customerNotes,
        preferredDate: input.preferredDate,
        preferredTimeSlotId: input.preferredTimeSlotId,
        subtotalSnapshot: breakdown.subtotal + breakdown.addOnsTotal,
        discountSnapshot: breakdown.discount,
        travelFeeSnapshot: breakdown.travelFee,
        taxSnapshot: breakdown.tax,
        totalSnapshot: breakdown.total,
        discountCodeId: quote.discountCodeId,
        idempotencyKey: options.idempotencyKey,
        createdByUserId: options.createdByUserId,
        items: {
          create: [
            {
              serviceId: service.id,
              descriptionSnapshot: service.nameAr,
              quantity: 1,
              unitPriceSnapshot: breakdown.subtotal,
              totalSnapshot: breakdown.subtotal,
              durationMinutesSnapshot: service.defaultDurationMinutes,
            },
            ...addOns.map((addOn) => ({
              serviceId: service.id,
              addOnId: addOn.id,
              descriptionSnapshot: addOn.nameEn,
              quantity: 1,
              unitPriceSnapshot: addOn.unitPrice,
              totalSnapshot: addOn.unitPrice,
              durationMinutesSnapshot: addOn.durationImpactMinutes,
            })),
          ],
        },
      },
    });

    assertTransition("DRAFT", "PENDING");
    const submitted = await tx.booking.update({
      where: { id: created.id },
      data: { status: "PENDING" },
    });

    await tx.bookingStatusHistory.createMany({
      data: [
        { bookingId: created.id, fromStatus: null, toStatus: "DRAFT", reason: "Booking created" },
        {
          bookingId: created.id,
          fromStatus: "DRAFT",
          toStatus: "PENDING",
          reason: "Booking submitted",
          actorUserId: options.createdByUserId,
        },
      ],
    });

    await tx.quote.update({ where: { id: quote.id }, data: { status: "CONVERTED" } });
    if (quote.discountCodeId) {
      await tx.discountCode.update({
        where: { id: quote.discountCodeId },
        data: { usageCount: { increment: 1 } },
      });
    }

    return submitted;
  });

  // FR-070: notification failure never blocks the booking action that
  // triggered it — logged best-effort, outside the DB transaction above.
  await notify({
    bookingId: booking.id,
    customerId,
    channel: "WHATSAPP",
    templateKey: "BOOKING_CONFIRMED",
    recipient: await resolveCustomerWhatsAppRecipient(customerId),
    payload: { referenceNumber: booking.referenceNumber },
  });

  return booking;
}

// Admin needs enough context to act on a request without opening five other
// screens (FR-045 detail view): who the customer is, where the address is,
// and what date/time they originally asked for — distinct from
// scheduledStartAt, which is only set once Admin actually schedules it.
// The `customer` relation is CustomerProfile, so its `user` sub-select is
// scoped to display-safe fields only — never passwordHash/refreshTokenVersion.
export async function getBookingById(id: string, requestingUser: { id: string; role: string }) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      items: { include: { service: true } },
      address: true,
      preferredTimeSlot: true,
      customer: { select: { user: { select: { fullName: true, phoneNormalized: true, email: true } } } },
      qualityIssues: {
        where: { source: { in: ["REVIEW", "COMPLAINT"] } },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      review: {
        select: { id: true, rating: true, submittedAt: true },
      },
    },
  });
  if (!booking) {
    throw new ApiError(404, "NOT_FOUND", "Booking not found");
  }
  if (requestingUser.role === "CUSTOMER" && booking.customerId !== requestingUser.id) {
    throw new ApiError(404, "NOT_FOUND", "Booking not found");
  }
  return booking;
}

export async function listOwnBookings(
  customerId: string,
  filters: { status?: string; page: number; pageSize: number }
) {
  const where = { customerId, ...(filters.status ? { status: filters.status as never } : {}) };
  const [items, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        qualityIssues: {
          where: { source: { in: ["REVIEW", "COMPLAINT"] } },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
    prisma.booking.count({ where }),
  ]);
  return { items, total, page: filters.page, pageSize: filters.pageSize };
}

export async function listAllBookings(filters: {
  status?: string;
  from?: Date;
  to?: Date;
  scheduledFrom?: Date;
  scheduledTo?: Date;
  needsScheduling?: boolean;
  customerId?: string;
  page: number;
  pageSize: number;
}) {
  const where = {
    ...(filters.status ? { status: filters.status as never } : {}),
    ...(filters.from || filters.to
      ? { createdAt: { gte: filters.from, lte: filters.to } }
      : {}),
    ...(filters.scheduledFrom || filters.scheduledTo
      ? { scheduledStartAt: { gte: filters.scheduledFrom, lte: filters.scheduledTo } }
      : {}),
    ...(filters.needsScheduling
      ? { status: "CONFIRMED" as never, scheduledStartAt: null }
      : {}),
    ...(filters.customerId ? { customerId: filters.customerId } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
    prisma.booking.count({ where }),
  ]);
  return { items, total, page: filters.page, pageSize: filters.pageSize };
}

// Public tracking exposes only a reduced, non-PII summary and is protected
// by the strict public-endpoint rate limiter in routes.ts.
export async function getBookingByReference(referenceNumber: string) {
  const booking = await prisma.booking.findUnique({
    where: { referenceNumber: referenceNumber.trim().toUpperCase() },
    include: { items: { include: { service: true }, take: 1 } },
  });
  if (!booking) {
    throw new ApiError(404, "NOT_FOUND", "Booking not found");
  }
  return {
    referenceNumber: booking.referenceNumber,
    status: booking.status,
    scheduledStartAt: booking.scheduledStartAt,
    serviceName: booking.items[0]?.service.nameAr ?? "",
  };
}

// FR-034: cannot confirm without price, address, service date, and valid
// contact — all are already guaranteed non-null by the DB schema once a
// booking exists (addressId, preferredDate, totalSnapshot), except the
// price, which needs an explicit check since it's nullable until quoted.
export async function confirmBooking(
  id: string,
  input: { priceOverride?: number; priceOverrideReason?: string },
  actor: ActorContext
) {
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) {
    throw new ApiError(404, "NOT_FOUND", "Booking not found");
  }

  if (booking.totalSnapshot == null) {
    throw new ApiError(409, "BOOKING_TRANSITION_INVALID", "Booking has no price to confirm");
  }
  if (input.priceOverride != null && !input.priceOverrideReason) {
    throw new ApiError(422, "VALIDATION_ERROR", "priceOverrideReason is required when overriding price");
  }

  assertTransition(booking.status, "CONFIRMED");

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.booking.update({
      where: { id },
      data:
        input.priceOverride != null
          ? { status: "CONFIRMED", totalSnapshot: input.priceOverride }
          : { status: "CONFIRMED" },
    });
    await tx.bookingStatusHistory.create({
      data: {
        bookingId: id,
        fromStatus: booking.status,
        toStatus: "CONFIRMED",
        reason: input.priceOverrideReason ?? "Confirmed by Admin",
        actorUserId: actor.actorUserId,
      },
    });
    return result;
  });

  if (input.priceOverride != null) {
    await recordAuditEntry({
      actorUserId: actor.actorUserId,
      action: "PRICE_OVERRIDE",
      entityType: "Booking",
      entityId: id,
      beforeSnapshot: { totalSnapshot: booking.totalSnapshot },
      afterSnapshot: { totalSnapshot: input.priceOverride, reason: input.priceOverrideReason },
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });
  }

  return updated;
}

export async function rejectBooking(id: string, reason: string, actor: ActorContext) {
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) {
    throw new ApiError(404, "NOT_FOUND", "Booking not found");
  }
  assertTransition(booking.status, "REJECTED");

  return prisma.$transaction(async (tx) => {
    const result = await tx.booking.update({
      where: { id },
      data: { status: "REJECTED", rejectionReason: reason },
    });
    await tx.bookingStatusHistory.create({
      data: {
        bookingId: id,
        fromStatus: booking.status,
        toStatus: "REJECTED",
        reason,
        actorUserId: actor.actorUserId,
      },
    });
    return result;
  });
}

// FR-029/FR-030/T110: sets the planned time + internal handling note on a
// CONFIRMED booking, checking the target TimeSlot's remaining capacity.
// Exceeding capacity requires an explicit `overrideCapacity` flag, recorded
// on both the status-history reason and an AuditLog entry (constitution
// Principle I: every capacity override must be auditable).
export async function scheduleBooking(
  id: string,
  input: ScheduleBookingInput,
  actor: ActorContext
) {
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) {
    throw new ApiError(404, "NOT_FOUND", "Booking not found");
  }
  if (booking.status !== "CONFIRMED") {
    throw new ApiError(409, "BOOKING_TRANSITION_INVALID", "Only confirmed bookings can be scheduled");
  }
  if (booking.scheduledStartAt) {
    throw new ApiError(409, "CONFLICT", "Booking is already scheduled; use reschedule instead");
  }

  const slot = await prisma.timeSlot.findUnique({ where: { id: input.timeSlotId } });
  if (!slot || !slot.active) {
    throw new ApiError(404, "NOT_FOUND", "Time slot not found");
  }

  const atCapacity = slot.bookedCount >= slot.capacity;
  if (atCapacity && !input.overrideCapacity) {
    throw new ApiError(409, "BOOKING_SLOT_UNAVAILABLE", "This time slot is at full capacity");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.booking.update({
      where: { id },
      data: {
        scheduledTimeSlotId: slot.id,
        scheduledStartAt: combineDateAndTime(slot.date, slot.startTime),
        scheduledEndAt: combineDateAndTime(slot.date, slot.endTime),
        internalHandlingNote: input.internalHandlingNote ?? booking.internalHandlingNote,
      },
    });
    await tx.timeSlot.update({ where: { id: slot.id }, data: { bookedCount: { increment: 1 } } });
    await tx.bookingStatusHistory.create({
      data: {
        bookingId: id,
        fromStatus: booking.status,
        toStatus: booking.status,
        reason: atCapacity ? "Scheduled with capacity override" : "Scheduled",
        actorUserId: actor.actorUserId,
      },
    });
    return result;
  });

  if (atCapacity) {
    await recordAuditEntry({
      actorUserId: actor.actorUserId,
      action: "CAPACITY_OVERRIDE",
      entityType: "Booking",
      entityId: id,
      afterSnapshot: { timeSlotId: slot.id, capacity: slot.capacity, bookedCount: slot.bookedCount + 1 },
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });
  }

  return updated;
}

// T111: moves an already-scheduled booking to a different time slot,
// releasing capacity on the old slot and re-checking capacity on the new
// one. Passes through the RESCHEDULED state per the state machine
// (CONFIRMED -> RESCHEDULED -> CONFIRMED) so the transition is audited via
// BookingStatusHistory like every other status change.
export async function rescheduleBooking(
  id: string,
  input: ScheduleBookingInput,
  actor: ActorContext
) {
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) {
    throw new ApiError(404, "NOT_FOUND", "Booking not found");
  }
  if (!booking.scheduledStartAt) {
    throw new ApiError(409, "CONFLICT", "Booking has not been scheduled yet; use schedule instead");
  }
  assertTransition(booking.status, "RESCHEDULED");

  const slot = await prisma.timeSlot.findUnique({ where: { id: input.timeSlotId } });
  if (!slot || !slot.active) {
    throw new ApiError(404, "NOT_FOUND", "Time slot not found");
  }

  const atCapacity = slot.bookedCount >= slot.capacity;
  if (atCapacity && !input.overrideCapacity) {
    throw new ApiError(409, "BOOKING_SLOT_UNAVAILABLE", "This time slot is at full capacity");
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (booking.scheduledTimeSlotId) {
      await tx.timeSlot.update({
        where: { id: booking.scheduledTimeSlotId },
        data: { bookedCount: { decrement: 1 } },
      });
    }
    await tx.timeSlot.update({ where: { id: slot.id }, data: { bookedCount: { increment: 1 } } });

    await tx.bookingStatusHistory.create({
      data: {
        bookingId: id,
        fromStatus: booking.status,
        toStatus: "RESCHEDULED",
        reason: "Rescheduled",
        actorUserId: actor.actorUserId,
      },
    });
    await tx.booking.update({ where: { id }, data: { status: "RESCHEDULED" } });

    const result = await tx.booking.update({
      where: { id },
      data: {
        status: "CONFIRMED",
        scheduledTimeSlotId: slot.id,
        scheduledStartAt: combineDateAndTime(slot.date, slot.startTime),
        scheduledEndAt: combineDateAndTime(slot.date, slot.endTime),
        internalHandlingNote: input.internalHandlingNote ?? booking.internalHandlingNote,
      },
    });
    await tx.bookingStatusHistory.create({
      data: {
        bookingId: id,
        fromStatus: "RESCHEDULED",
        toStatus: "CONFIRMED",
        reason: atCapacity ? "Rescheduled with capacity override" : "Rescheduled",
        actorUserId: actor.actorUserId,
      },
    });
    return result;
  });

  if (atCapacity) {
    await recordAuditEntry({
      actorUserId: actor.actorUserId,
      action: "CAPACITY_OVERRIDE",
      entityType: "Booking",
      entityId: id,
      afterSnapshot: { timeSlotId: slot.id, capacity: slot.capacity, bookedCount: slot.bookedCount + 1 },
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });
  }

  return updated;
}

// FR-037/FR-040: cancellable by Customer (own booking) or Admin; no fee
// logic applied regardless of timing. Releases capacity on the scheduled
// slot, if any.
export async function cancelBooking(
  id: string,
  reason: string,
  cancelledByRole: "CUSTOMER" | "ADMIN",
  actor: ActorContext
) {
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) {
    throw new ApiError(404, "NOT_FOUND", "Booking not found");
  }
  assertTransition(booking.status, "CANCELLED");

  return prisma.$transaction(async (tx) => {
    if (booking.scheduledTimeSlotId) {
      await tx.timeSlot.update({
        where: { id: booking.scheduledTimeSlotId },
        data: { bookedCount: { decrement: 1 } },
      });
    }
    const result = await tx.booking.update({
      where: { id },
      data: { status: "CANCELLED", cancellationReason: reason, cancelledByRole },
    });
    await tx.bookingStatusHistory.create({
      data: {
        bookingId: id,
        fromStatus: booking.status,
        toStatus: "CANCELLED",
        reason,
        actorUserId: actor.actorUserId,
      },
    });
    // spec Edge Cases: a pending reschedule request on a cancelled booking
    // is auto-rejected in the same transaction, not left dangling.
    await autoRejectPendingRequestsForBooking(tx, id);
    return result;
  });
}

function combineDateAndTime(date: Date, time: string): Date {
  const [hoursStr, minutesStr] = time.split(":");
  const combined = new Date(date);
  combined.setUTCHours(Number(hoursStr), Number(minutesStr), 0, 0);
  return combined;
}

// T122 (US5): en-route/arrive are sub-state timestamps only — they do not
// change `status`, which stays CONFIRMED until `/start` (research.md R5).
// Still audit-logged (FR-004/FR-005) since each is a distinct actor-driven
// operational event, even though no BookingStatusHistory row applies.
export async function markEnRoute(id: string, actor: ActorContext) {
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) {
    throw new ApiError(404, "NOT_FOUND", "Booking not found");
  }
  if (booking.status !== "CONFIRMED") {
    throw new ApiError(409, "BOOKING_TRANSITION_INVALID", "Only confirmed bookings can be marked en route");
  }
  const updated = await prisma.booking.update({ where: { id }, data: { enRouteAt: new Date() } });
  await recordAuditEntry({
    actorUserId: actor.actorUserId,
    action: "BOOKING_EN_ROUTE",
    entityType: "Booking",
    entityId: id,
    ipAddress: actor.ipAddress,
    userAgent: actor.userAgent,
  });
  return updated;
}

export async function markArrived(id: string, actor: ActorContext) {
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) {
    throw new ApiError(404, "NOT_FOUND", "Booking not found");
  }
  if (booking.status !== "CONFIRMED") {
    throw new ApiError(409, "BOOKING_TRANSITION_INVALID", "Only confirmed bookings can be marked arrived");
  }
  const updated = await prisma.booking.update({ where: { id }, data: { arrivedAt: new Date() } });
  await recordAuditEntry({
    actorUserId: actor.actorUserId,
    action: "BOOKING_ARRIVED",
    entityType: "Booking",
    entityId: id,
    ipAddress: actor.ipAddress,
    userAgent: actor.userAgent,
  });
  return updated;
}

// FR-036: `arrivedAt` must already be set before entering IN_PROGRESS.
export async function startExecution(id: string, actor: ActorContext) {
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) {
    throw new ApiError(404, "NOT_FOUND", "Booking not found");
  }
  if (!booking.arrivedAt) {
    throw new ApiError(409, "BOOKING_TRANSITION_INVALID", "Cannot start before arrival is recorded");
  }
  assertTransition(booking.status, "IN_PROGRESS");

  return prisma.$transaction(async (tx) => {
    const result = await tx.booking.update({
      where: { id },
      data: { status: "IN_PROGRESS", startedAt: new Date() },
    });
    await tx.bookingStatusHistory.create({
      data: {
        bookingId: id,
        fromStatus: booking.status,
        toStatus: "IN_PROGRESS",
        reason: "Execution started",
        actorUserId: actor.actorUserId,
      },
    });
    return result;
  });
}

// Completes an in-progress booking and queues the FEEDBACK_REQUEST
// notification best-effort (a notification failure never blocks the booking
// action itself).
export async function completeBooking(id: string, actor: ActorContext) {
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) {
    throw new ApiError(404, "NOT_FOUND", "Booking not found");
  }
  assertTransition(booking.status, "COMPLETED");

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.booking.update({
      where: { id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
    await tx.bookingStatusHistory.create({
      data: {
        bookingId: id,
        fromStatus: booking.status,
        toStatus: "COMPLETED",
        reason: "Execution completed",
        actorUserId: actor.actorUserId,
      },
    });
    return result;
  });

  await notify({
    bookingId: id,
    customerId: booking.customerId,
    channel: "WHATSAPP",
    templateKey: "FEEDBACK_REQUEST",
    recipient: await resolveCustomerWhatsAppRecipient(booking.customerId),
    payload: { referenceNumber: booking.referenceNumber },
  });

  return updated;
}

export async function getBookingHistory(bookingId: string) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) {
    throw new ApiError(404, "NOT_FOUND", "Booking not found");
  }
  return prisma.bookingStatusHistory.findMany({
    where: { bookingId },
    orderBy: { createdAt: "asc" },
  });
}
