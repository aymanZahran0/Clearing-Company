import { ApiError } from "@nuqaa-asir/shared";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { recordAuditEntry } from "../../middleware/auditLogger.js";
import { notify } from "../notifications/service.js";
import { rescheduleBooking } from "../bookings/service.js";
import type {
  ApproveRescheduleRequestInput,
  RejectRescheduleRequestInput,
  SubmitRescheduleRequestInput,
} from "./schema.js";

interface ActorContext {
  actorUserId: string;
  ipAddress?: string;
  userAgent?: string;
}

interface RequestingUser {
  id: string;
  role: string;
}

async function resolveCustomerWhatsAppRecipient(customerId: string): Promise<string> {
  const profile = await prisma.customerProfile.findUnique({
    where: { userId: customerId },
    select: { user: { select: { phoneNormalized: true } } },
  });
  return profile?.user.phoneNormalized ?? "";
}

// contracts/reschedule-requests.md POST /bookings/:id/reschedule-requests.
export async function submitRescheduleRequest(
  bookingId: string,
  input: SubmitRescheduleRequestInput,
  requestingUser: RequestingUser,
  actor: ActorContext
) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) {
    throw new ApiError(404, "NOT_FOUND", "Booking not found");
  }
  if (requestingUser.role === "CUSTOMER" && booking.customerId !== requestingUser.id) {
    throw new ApiError(404, "NOT_FOUND", "Booking not found");
  }
  if (booking.status !== "CONFIRMED" || !booking.scheduledStartAt || booking.scheduledStartAt < new Date()) {
    throw new ApiError(409, "CONFLICT", "This booking is not in a reschedulable state");
  }

  const existingPending = await prisma.rescheduleRequest.findFirst({
    where: { bookingId, status: "PENDING" },
  });
  if (existingPending) {
    throw new ApiError(409, "CONFLICT", "A reschedule request is already pending for this booking");
  }

  let created;
  try {
    created = await prisma.rescheduleRequest.create({
      data: {
        bookingId,
        requestedByUserId: requestingUser.id,
        requestedStartAt: input.requestedStartAt,
        requestedTimeSlotId: input.requestedTimeSlotId,
        reason: input.reason,
      },
    });
  } catch (err) {
    if ((err as { code?: string }).code === "P2002") {
      throw new ApiError(409, "CONFLICT", "A reschedule request is already pending for this booking");
    }
    throw err;
  }

  await recordAuditEntry({
    actorUserId: actor.actorUserId,
    action: "RESCHEDULE_REQUEST_SUBMITTED",
    entityType: "RescheduleRequest",
    entityId: created.id,
    afterSnapshot: { bookingId, requestedStartAt: input.requestedStartAt },
    ipAddress: actor.ipAddress,
    userAgent: actor.userAgent,
  });

  return created;
}

export async function listRescheduleRequests(filters: {
  status?: "PENDING" | "APPROVED" | "REJECTED" | "AUTO_REJECTED";
  page: number;
  pageSize: number;
}) {
  const where = filters.status ? { status: filters.status } : {};

  const [items, total] = await Promise.all([
    prisma.rescheduleRequest.findMany({
      where,
      include: {
        booking: {
          select: {
            referenceNumber: true,
            scheduledStartAt: true,
            customer: { select: { user: { select: { fullName: true } } } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
    prisma.rescheduleRequest.count({ where }),
  ]);

  return { items, total, page: filters.page, pageSize: filters.pageSize };
}

async function getPendingRequest(id: string) {
  const request = await prisma.rescheduleRequest.findUnique({ where: { id } });
  if (!request || request.status !== "PENDING") {
    throw new ApiError(404, "NOT_FOUND", "Reschedule request not found or already decided");
  }
  return request;
}

// contracts/reschedule-requests.md POST /admin/reschedule-requests/:id/approve —
// delegates the actual slot/capacity/status mutation to the existing
// rescheduleBooking() transaction rather than duplicating that logic here.
export async function approveRescheduleRequest(
  id: string,
  input: ApproveRescheduleRequestInput,
  actor: ActorContext
) {
  const request = await getPendingRequest(id);

  await rescheduleBooking(
    request.bookingId,
    {
      timeSlotId: request.requestedTimeSlotId!,
      overrideCapacity: input.overrideCapacity,
    },
    actor
  );

  const updated = await prisma.rescheduleRequest.update({
    where: { id },
    data: { status: "APPROVED", decidedByUserId: actor.actorUserId, decidedAt: new Date() },
  });

  const booking = await prisma.booking.findUniqueOrThrow({ where: { id: request.bookingId } });
  await notify({
    bookingId: booking.id,
    customerId: booking.customerId,
    channel: "WHATSAPP",
    templateKey: "RESCHEDULE_APPROVED",
    recipient: await resolveCustomerWhatsAppRecipient(booking.customerId),
    payload: { referenceNumber: booking.referenceNumber },
  });

  await recordAuditEntry({
    actorUserId: actor.actorUserId,
    action: "RESCHEDULE_REQUEST_APPROVED",
    entityType: "RescheduleRequest",
    entityId: id,
    ipAddress: actor.ipAddress,
    userAgent: actor.userAgent,
  });

  return updated;
}

export async function rejectRescheduleRequest(
  id: string,
  input: RejectRescheduleRequestInput,
  actor: ActorContext
) {
  const request = await getPendingRequest(id);

  const updated = await prisma.rescheduleRequest.update({
    where: { id },
    data: {
      status: "REJECTED",
      reason: input.reason,
      decidedByUserId: actor.actorUserId,
      decidedAt: new Date(),
    },
  });

  const booking = await prisma.booking.findUniqueOrThrow({ where: { id: request.bookingId } });
  await notify({
    bookingId: booking.id,
    customerId: booking.customerId,
    channel: "WHATSAPP",
    templateKey: "RESCHEDULE_REJECTED",
    recipient: await resolveCustomerWhatsAppRecipient(booking.customerId),
    payload: { referenceNumber: booking.referenceNumber, reason: input.reason },
  });

  await recordAuditEntry({
    actorUserId: actor.actorUserId,
    action: "RESCHEDULE_REQUEST_REJECTED",
    entityType: "RescheduleRequest",
    entityId: id,
    afterSnapshot: { reason: input.reason },
    ipAddress: actor.ipAddress,
    userAgent: actor.userAgent,
  });

  return updated;
}

// Called from bookings/service.ts's cancelBooking() transaction (spec Edge
// Cases): a pending reschedule request on a cancelled booking is
// auto-rejected in the same transaction, not left dangling.
export function autoRejectPendingRequestsForBooking(tx: Prisma.TransactionClient, bookingId: string) {
  return tx.rescheduleRequest.updateMany({
    where: { bookingId, status: "PENDING" },
    data: { status: "AUTO_REJECTED", reason: "Booking was cancelled", decidedAt: new Date() },
  });
}
