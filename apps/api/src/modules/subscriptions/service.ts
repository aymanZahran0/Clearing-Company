import { ApiError } from "@nuqaa-asir/shared";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import type { CreateSubscriptionInput, UpdateSubscriptionInput } from "./schema.js";

export async function createSubscription(input: CreateSubscriptionInput) {
  return prisma.subscription.create({
    data: {
      customerId: input.customerId,
      addressId: input.addressId,
      serviceConfigurationJson: input.serviceConfiguration as Prisma.InputJsonValue,
      frequency: input.frequency,
      preferredWeekday: input.preferredWeekday,
      preferredTimeWindow: input.preferredTimeWindow,
      priceSnapshot: input.priceSnapshot,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
    },
  });
}

export async function listSubscriptions(filters: {
  status?: string;
  page: number;
  pageSize: number;
}) {
  const where = filters.status ? { status: filters.status as never } : {};
  const [items, total] = await Promise.all([
    prisma.subscription.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
    prisma.subscription.count({ where }),
  ]);
  return { items, total, page: filters.page, pageSize: filters.pageSize };
}

export function listOwnSubscriptions(customerId: string) {
  return prisma.subscription.findMany({ where: { customerId }, orderBy: { createdAt: "desc" } });
}

export async function getSubscription(id: string) {
  const subscription = await prisma.subscription.findUnique({ where: { id } });
  if (!subscription) {
    throw new ApiError(404, "NOT_FOUND", "Subscription not found");
  }
  return subscription;
}

export async function updateSubscription(id: string, input: UpdateSubscriptionInput) {
  await getSubscription(id);
  return prisma.subscription.update({
    where: { id },
    data: {
      addressId: input.addressId,
      serviceConfigurationJson: input.serviceConfiguration as Prisma.InputJsonValue | undefined,
      frequency: input.frequency,
      preferredWeekday: input.preferredWeekday,
      preferredTimeWindow: input.preferredTimeWindow,
      priceSnapshot: input.priceSnapshot,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
    },
  });
}

export async function pauseSubscription(id: string) {
  await getSubscription(id);
  return prisma.subscription.update({ where: { id }, data: { status: "PAUSED" } });
}

export async function resumeSubscription(id: string) {
  await getSubscription(id);
  return prisma.subscription.update({ where: { id }, data: { status: "ACTIVE" } });
}

// FR-057 (implied): cancelling a subscription stops future generation but
// never touches Booking rows already generated (T158) — no cascade delete,
// no status change on prior occurrences.
export async function cancelSubscription(id: string) {
  await getSubscription(id);
  return prisma.subscription.update({ where: { id }, data: { status: "CANCELLED" } });
}

export async function listOccurrences(subscriptionId: string) {
  await getSubscription(subscriptionId);
  return prisma.booking.findMany({
    where: { subscriptionId },
    orderBy: { occurrenceDate: "asc" },
  });
}

// T149's "occurrence editor": skip a single future occurrence without
// altering the subscription's own schedule/cadence. A CANCELLED placeholder
// booking is written for that date so the generation job's
// (subscriptionId, occurrenceDate) uniqueness check treats it as already
// handled and never re-generates it.
export async function skipOccurrence(subscriptionId: string, occurrenceDate: Date) {
  const subscription = await getSubscription(subscriptionId);

  const existing = await prisma.booking.findUnique({
    where: { subscriptionId_occurrenceDate: { subscriptionId, occurrenceDate } },
  });
  if (existing) {
    if (existing.status === "CANCELLED") return existing;
    throw new ApiError(409, "CONFLICT", "This occurrence already has a booking; cancel it directly instead");
  }

  return prisma.booking.create({
    data: {
      referenceNumber: `SKIP-${subscriptionId.slice(0, 8)}-${occurrenceDate.toISOString().slice(0, 10)}`,
      verificationToken: `skip-${Date.now()}`,
      customerId: subscription.customerId,
      addressId: subscription.addressId,
      source: "ADMIN_PHONE",
      status: "CANCELLED",
      cancellationReason: "Occurrence skipped by Admin",
      cancelledByRole: "ADMIN",
      propertyType: "OTHER",
      propertyDetailsJson: {},
      preferredDate: occurrenceDate,
      subscriptionId,
      occurrenceDate,
    },
  });
}
