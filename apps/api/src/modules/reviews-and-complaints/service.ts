import { ApiError } from "@nuqaa-asir/shared";
import { prisma } from "../../lib/prisma.js";
import { assertTransition } from "../../lib/bookingStateMachine.js";
import type {
  CreateComplaintInput,
  CreateReviewInput,
  ListQualityIssuesQuery,
  UpdateQualityIssueInput,
} from "./schema.js";

async function getCustomerBooking(bookingId: string, customerId: string) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.customerId !== customerId) {
    throw new ApiError(404, "NOT_FOUND", "Booking not found");
  }
  return booking;
}

export async function createReview(bookingId: string, customerId: string, input: CreateReviewInput) {
  const booking = await getCustomerBooking(bookingId, customerId);
  if (booking.status !== "COMPLETED") {
    throw new ApiError(409, "CONFLICT", "Only completed bookings can be reviewed");
  }
  if (await prisma.review.findUnique({ where: { bookingId } })) {
    throw new ApiError(409, "CONFLICT", "This booking has already been reviewed");
  }
  return prisma.review.create({
    data: { bookingId, customerId, rating: input.rating, comment: input.comment, followUpRequired: false },
  });
}

export async function createComplaint(
  bookingId: string,
  customerId: string,
  input: CreateComplaintInput
) {
  const booking = await getCustomerBooking(bookingId, customerId);
  if (booking.status !== "COMPLETED" && booking.status !== "COMPLAINT_OPENED") {
    throw new ApiError(409, "CONFLICT", "Only completed bookings can have a complaint");
  }
  const existing = await prisma.qualityIssue.findFirst({
    where: { bookingId, source: "COMPLAINT" },
  });
  if (existing) {
    throw new ApiError(409, "CONFLICT", "A complaint already exists for this booking");
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
      include: {
        booking: {
          select: {
            referenceNumber: true,
            preferredDate: true,
            scheduledStartAt: true,
            customer: {
              select: {
                user: {
                  select: { fullName: true, phoneNormalized: true, email: true },
                },
              },
            },
            items: {
              where: { addOnId: null },
              take: 1,
              select: { service: { select: { nameAr: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
    prisma.qualityIssue.count({ where }),
  ]);
  return { items, total, page: filters.page, pageSize: filters.pageSize };
}

export async function getQualityIssue(id: string) {
  const issue = await prisma.qualityIssue.findUnique({
    where: { id },
    include: {
      booking: {
        select: {
          referenceNumber: true,
          preferredDate: true,
          scheduledStartAt: true,
          customer: {
            select: {
              user: {
                select: { fullName: true, phoneNormalized: true, email: true },
              },
            },
          },
          items: {
            where: { addOnId: null },
            take: 1,
            select: { service: { select: { nameAr: true } } },
          },
          address: {
            select: { city: true, neighborhood: true, street: true },
          },
        },
      },
    },
  });
  if (!issue) throw new ApiError(404, "NOT_FOUND", "Complaint not found");
  return issue;
}

export async function updateQualityIssue(
  id: string,
  input: UpdateQualityIssueInput,
  actorUserId: string
) {
  const issue = await getQualityIssue(id);
  if (input.status === "CLOSED" && !(input.resolution ?? issue.resolution)) {
    throw new ApiError(422, "VALIDATION_ERROR", "resolution is required before closing a complaint");
  }
  const updated = await prisma.qualityIssue.update({
    where: { id },
    data: {
      status: input.status,
      resolution: input.resolution,
      resolvedAt:
        input.status === "RESOLVED" || input.status === "CLOSED"
          ? new Date()
          : input.status
            ? null
            : issue.resolvedAt,
    },
  });
  if (input.status && input.status !== issue.status) {
    const booking = await prisma.booking.findUnique({ where: { id: issue.bookingId } });
    const target = input.status === "OPEN" || input.status === "IN_REVIEW"
      ? "COMPLAINT_OPENED"
      : "COMPLETED";
    if (booking && booking.status !== target) {
      assertTransition(booking.status, target);
      await prisma.$transaction([
        prisma.booking.update({ where: { id: booking.id }, data: { status: target } }),
        prisma.bookingStatusHistory.create({
          data: {
            bookingId: booking.id,
            fromStatus: booking.status,
            toStatus: target,
            reason: `Complaint status changed to ${input.status}`,
            actorUserId,
          },
        }),
      ]);
    }
  }
  return updated;
}
