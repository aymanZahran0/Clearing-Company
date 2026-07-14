import { ApiError } from "@nuqaa-asir/shared";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { generateBookingReference, generateVerificationToken } from "../../lib/bookingReference.js";
import { assertTransition } from "../../lib/bookingStateMachine.js";
import { recordAuditEntry } from "../../middleware/auditLogger.js";
import type {
  CreateComplaintInput,
  CreateReviewInput,
  ListQualityIssuesQuery,
  UpdateQualityIssueInput,
} from "./schema.js";

interface ActorContext {
  actorUserId: string;
  ipAddress?: string;
  userAgent?: string;
}

// FR-050/FR-054: one review per completed booking; a rating <= 2
// auto-opens a QualityIssue (source = REVIEW) and moves the booking to
// COMPLAINT_OPENED so it surfaces in the Admin quality queue without the
// customer having to separately file a complaint.
export async function createReview(bookingId: string, customerId: string, input: CreateReviewInput) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.customerId !== customerId) {
    throw new ApiError(404, "NOT_FOUND", "Booking not found");
  }
  if (booking.status !== "COMPLETED") {
    throw new ApiError(409, "CONFLICT", "Only completed bookings can be reviewed");
  }

  const existing = await prisma.review.findUnique({ where: { bookingId } });
  if (existing) {
    throw new ApiError(409, "CONFLICT", "This booking has already been reviewed");
  }

  const followUpRequired = input.rating <= 2;

  return prisma.$transaction(async (tx) => {
    const review = await tx.review.create({
      data: {
        bookingId,
        customerId,
        rating: input.rating,
        comment: input.comment,
        followUpRequired,
      },
    });

    if (followUpRequired) {
      await tx.qualityIssue.create({
        data: {
          bookingId,
          source: "REVIEW",
          category: "low_rating",
          severity: input.rating === 1 ? "HIGH" : "MEDIUM",
          description: input.comment ?? `Customer rated this booking ${input.rating}/5`,
        },
      });
      assertTransition(booking.status, "COMPLAINT_OPENED");
      await tx.booking.update({ where: { id: bookingId }, data: { status: "COMPLAINT_OPENED" } });
      await tx.bookingStatusHistory.create({
        data: {
          bookingId,
          fromStatus: booking.status,
          toStatus: "COMPLAINT_OPENED",
          reason: `Low rating (${input.rating}/5) opened a quality issue`,
        },
      });
    }

    return review;
  });
}

// T136/FR-052: a standalone complaint, independent of the star rating.
export async function createComplaint(
  bookingId: string,
  customerId: string,
  input: CreateComplaintInput
) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.customerId !== customerId) {
    throw new ApiError(404, "NOT_FOUND", "Booking not found");
  }

  return prisma.$transaction(async (tx) => {
    const issue = await tx.qualityIssue.create({
      data: {
        bookingId,
        source: "COMPLAINT",
        category: input.category,
        severity: input.severity,
        description: input.description,
      },
    });

    if (booking.status === "COMPLETED") {
      assertTransition(booking.status, "COMPLAINT_OPENED");
      await tx.booking.update({ where: { id: bookingId }, data: { status: "COMPLAINT_OPENED" } });
      await tx.bookingStatusHistory.create({
        data: {
          bookingId,
          fromStatus: booking.status,
          toStatus: "COMPLAINT_OPENED",
          reason: "Complaint filed",
        },
      });
    }

    return issue;
  });
}

export async function listQualityIssues(filters: ListQualityIssuesQuery) {
  const where = {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.source ? { source: filters.source } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.qualityIssue.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
    prisma.qualityIssue.count({ where }),
  ]);
  return { items, total, page: filters.page, pageSize: filters.pageSize };
}

export async function getQualityIssue(id: string) {
  const issue = await prisma.qualityIssue.findUnique({ where: { id } });
  if (!issue) {
    throw new ApiError(404, "NOT_FOUND", "Quality issue not found");
  }
  return issue;
}

// FR-052: `resolution` is required before a status transition to CLOSED.
export async function updateQualityIssue(
  id: string,
  input: UpdateQualityIssueInput,
  actor: ActorContext
) {
  const issue = await getQualityIssue(id);

  if (input.status === "CLOSED" && !(input.resolution ?? issue.resolution)) {
    throw new ApiError(422, "VALIDATION_ERROR", "resolution is required before closing a quality issue");
  }

  const updated = await prisma.qualityIssue.update({
    where: { id },
    data: {
      category: input.category,
      severity: input.severity,
      ownerUserId: input.ownerUserId,
      status: input.status,
      resolution: input.resolution,
      resolvedAt: input.status === "RESOLVED" || input.status === "CLOSED" ? new Date() : issue.resolvedAt,
    },
  });

  await recordAuditEntry({
    actorUserId: actor.actorUserId,
    action: "QUALITY_ISSUE_UPDATED",
    entityType: "QualityIssue",
    entityId: id,
    beforeSnapshot: { status: issue.status },
    afterSnapshot: { status: updated.status, resolution: updated.resolution },
    ipAddress: actor.ipAddress,
    userAgent: actor.userAgent,
  });

  return updated;
}

// FR-053: creates a new Booking linked via `originalBookingId`, copying
// customer/address/service so the customer never has to re-enter details.
// Priced as complimentary (rework, not a new sale) — the Admin can still
// override the price at confirm time like any other booking.
export async function createReworkBooking(qualityIssueId: string, actor: ActorContext) {
  const issue = await getQualityIssue(qualityIssueId);
  if (issue.reworkBookingId) {
    throw new ApiError(409, "CONFLICT", "A rework booking already exists for this issue");
  }

  const original = await prisma.booking.findUnique({
    where: { id: issue.bookingId },
    include: { items: true },
  });
  if (!original) {
    throw new ApiError(404, "NOT_FOUND", "Original booking not found");
  }

  const reworkBooking = await prisma.$transaction(async (tx) => {
    const created = await tx.booking.create({
      data: {
        referenceNumber: generateBookingReference(),
        verificationToken: generateVerificationToken(),
        customerId: original.customerId,
        addressId: original.addressId,
        source: "ADMIN_PHONE",
        status: "PENDING",
        propertyType: original.propertyType,
        propertyDetailsJson: original.propertyDetailsJson as Prisma.InputJsonValue,
        customerNotes: `Rework for booking ${original.referenceNumber}`,
        preferredDate: new Date(Date.now() + 86400000),
        subtotalSnapshot: 0,
        discountSnapshot: 0,
        travelFeeSnapshot: 0,
        taxSnapshot: 0,
        totalSnapshot: 0,
        originalBookingId: original.id,
        createdByUserId: actor.actorUserId,
        items: {
          create: original.items.map((item) => ({
            serviceId: item.serviceId,
            addOnId: item.addOnId,
            descriptionSnapshot: `Rework: ${item.descriptionSnapshot}`,
            quantity: item.quantity,
            unitPriceSnapshot: 0,
            totalSnapshot: 0,
            durationMinutesSnapshot: item.durationMinutesSnapshot,
          })),
        },
      },
    });

    await tx.bookingStatusHistory.create({
      data: {
        bookingId: created.id,
        fromStatus: null,
        toStatus: "PENDING",
        reason: `Rework of ${original.referenceNumber}`,
        actorUserId: actor.actorUserId,
      },
    });

    await tx.qualityIssue.update({
      where: { id: qualityIssueId },
      data: { reworkBookingId: created.id },
    });

    return created;
  });

  await recordAuditEntry({
    actorUserId: actor.actorUserId,
    action: "REWORK_BOOKING_CREATED",
    entityType: "QualityIssue",
    entityId: qualityIssueId,
    afterSnapshot: { reworkBookingId: reworkBooking.id },
    ipAddress: actor.ipAddress,
    userAgent: actor.userAgent,
  });

  return reworkBooking;
}

// T139: powers the Admin dashboard's low-rating/aged-complaint alert.
export async function getQualityAlerts() {
  const AGED_THRESHOLD_DAYS = 3;
  const agedSince = new Date(Date.now() - AGED_THRESHOLD_DAYS * 24 * 60 * 60 * 1000);

  const [lowRatingCount, agedOpenIssues] = await Promise.all([
    prisma.review.count({ where: { followUpRequired: true } }),
    prisma.qualityIssue.count({
      where: { status: { in: ["OPEN", "IN_REVIEW"] }, createdAt: { lte: agedSince } },
    }),
  ]);

  return { lowRatingCount, agedOpenIssues, agedThresholdDays: AGED_THRESHOLD_DAYS };
}
