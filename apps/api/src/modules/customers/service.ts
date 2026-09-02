import { prisma } from "../../lib/prisma.js";
import { ApiError } from "@nuqaa-asir/shared";
import { normalizeSaudiPhone } from "../../lib/phoneNormalization.js";
import { recordAuditEntry } from "../../middleware/auditLogger.js";
import type { UpdateOwnProfileInput, SuspendCustomerInput, ReactivateCustomerInput } from "./schema.js";

interface ActorContext {
  actorUserId: string;
  ipAddress?: string;
  userAgent?: string;
}

function tryNormalizePhone(value: string): string | null {
  try {
    return normalizeSaudiPhone(value);
  } catch {
    return null;
  }
}

function toPublicCustomer(row: {
  userId: string;
  user: { fullName: string; phoneNormalized: string | null; email: string | null };
  preferredChannel: string;
  marketingConsent: boolean;
  customerType: string;
  tags: string[];
}) {
  return {
    userId: row.userId,
    fullName: row.user.fullName,
    phone: row.user.phoneNormalized,
    email: row.user.email,
    preferredChannel: row.preferredChannel,
    marketingConsent: row.marketingConsent,
    customerType: row.customerType,
    tags: row.tags,
  };
}

// FR-019/US5 scenario 4: Admin-facing list/detail summary. Deliberately
// excludes passwordHash/refreshTokenVersion and every token table — only
// the fields Admin customer-management screens need.
function toCustomerSummary(row: {
  userId: string;
  user: {
    fullName: string;
    phoneNormalized: string | null;
    email: string | null;
    status: string;
    createdAt: Date;
    lastLoginAt: Date | null;
  };
  _count: { bookings: number };
}) {
  return {
    id: row.userId,
    fullName: row.user.fullName,
    phone: row.user.phoneNormalized,
    email: row.user.email,
    status: row.user.status,
    createdAt: row.user.createdAt,
    lastLoginAt: row.user.lastLoginAt,
    bookingsCount: row._count.bookings,
  };
}

async function getCustomerProfileOrThrow(userId: string) {
  const profile = await prisma.customerProfile.findUnique({
    where: { userId },
    include: { user: true, _count: { select: { bookings: true } } },
  });
  if (!profile || profile.user.role !== "CUSTOMER") {
    throw new ApiError(404, "NOT_FOUND", "Customer not found");
  }
  return profile;
}

export async function getOwnProfile(userId: string) {
  const profile = await prisma.customerProfile.findUnique({
    where: { userId },
    include: { user: true },
  });
  if (!profile) {
    throw new ApiError(404, "NOT_FOUND", "Customer profile not found");
  }
  return toPublicCustomer(profile);
}

export async function updateOwnProfile(userId: string, input: UpdateOwnProfileInput) {
  const { fullName, email, ...profileFields } = input;

  await prisma.$transaction([
    ...(fullName !== undefined || email !== undefined
      ? [prisma.user.update({ where: { id: userId }, data: { fullName, email } })]
      : []),
    ...(Object.keys(profileFields).length > 0
      ? [prisma.customerProfile.update({ where: { userId }, data: profileFields })]
      : []),
  ]);

  return getOwnProfile(userId);
}

// FR-017/FR-018: Admin searches by (normalized) phone number, name, or
// email, optionally filtered by status. Customers are stored in E.164
// (phoneNormalized), but Admins naturally type the local format
// (05XXXXXXXX) — a full valid number is normalized before matching so that
// natural-format input actually finds the customer; a partial/non-phone
// search term still falls through to a raw substring match.
export async function searchCustomers(
  search: string | undefined,
  page: number,
  pageSize: number,
  status?: "ACTIVE" | "INVITED" | "SUSPENDED"
) {
  const normalizedPhone = search ? tryNormalizePhone(search) : null;
  const where = {
    role: "CUSTOMER" as const,
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { phoneNormalized: { contains: normalizedPhone ?? search } },
            { fullName: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { customerProfile: { include: { _count: { select: { bookings: true } } } } },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    items: items.map((user) =>
      toCustomerSummary({
        userId: user.id,
        user,
        _count: { bookings: user.customerProfile?._count.bookings ?? 0 },
      })
    ),
    total,
    page,
    pageSize,
  };
}

// US5 scenario 5: Admin detail view — sanitized summary only (FR-019); the
// existing addresses/bookings endpoints already give Admin the rest.
export async function getCustomerSummaryById(userId: string) {
  const profile = await getCustomerProfileOrThrow(userId);
  return toCustomerSummary(profile);
}

// FR-016/FR-018/research.md R6: Admin creates a customer for the
// phone/WhatsApp channel with no password set (status INVITED). Shared by
// `POST /customers` (explicit creation, used by the New Phone Booking
// screen before an address can be attached) and by
// bookings/service.ts's inline `newCustomer` path.
export async function createInvitedCustomer(input: { fullName: string; phone: string }) {
  const phoneNormalized = normalizeSaudiPhone(input.phone);
  const existing = await prisma.user.findUnique({ where: { phoneNormalized } });
  if (existing) return existing;

  return prisma.user.create({
    data: {
      fullName: input.fullName,
      phoneNormalized,
      role: "CUSTOMER",
      status: "INVITED",
      customerProfile: { create: {} },
    },
  });
}

// FR-013/FR-014/FR-017/FR-017a: suspend a Customer's access without
// touching their business history. Only SUSPENDED <-> ACTIVE/INVITED is a
// real transition — attempting to suspend an already-suspended Customer is
// a conflict, not a silent no-op, so only genuine transitions get audited.
export async function suspendCustomer(userId: string, input: SuspendCustomerInput, actor: ActorContext) {
  const profile = await getCustomerProfileOrThrow(userId);
  if (profile.user.status === "SUSPENDED") {
    throw new ApiError(409, "CUSTOMER_ALREADY_SUSPENDED", "This Customer is already suspended");
  }

  const previousStatus = profile.user.status;
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { status: "SUSPENDED", refreshTokenVersion: { increment: 1 } },
    }),
    prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);

  await recordAuditEntry({
    actorUserId: actor.actorUserId,
    action: "CUSTOMER_SUSPENDED",
    entityType: "User",
    entityId: userId,
    beforeSnapshot: { status: previousStatus },
    afterSnapshot: { status: "SUSPENDED", reason: input.reason },
    ipAddress: actor.ipAddress,
    userAgent: actor.userAgent,
  });

  return getCustomerSummaryById(userId);
}

// FR-017/FR-017a: reactivation does not restore old refresh tokens — the
// Customer must log in again (contracts/customer-account-status.md).
export async function reactivateCustomer(userId: string, input: ReactivateCustomerInput, actor: ActorContext) {
  const profile = await getCustomerProfileOrThrow(userId);
  if (profile.user.status !== "SUSPENDED") {
    throw new ApiError(409, "CUSTOMER_NOT_SUSPENDED", "This Customer is not currently suspended");
  }

  await prisma.user.update({ where: { id: userId }, data: { status: "ACTIVE" } });

  await recordAuditEntry({
    actorUserId: actor.actorUserId,
    action: "CUSTOMER_REACTIVATED",
    entityType: "User",
    entityId: userId,
    beforeSnapshot: { status: "SUSPENDED" },
    afterSnapshot: { status: "ACTIVE", reason: input.reason ?? null },
    ipAddress: actor.ipAddress,
    userAgent: actor.userAgent,
  });

  return getCustomerSummaryById(userId);
}

export async function deleteCustomer(userId: string, actor: ActorContext) {
  const profile = await getCustomerProfileOrThrow(userId);

  if (profile._count.bookings > 0) {
    throw new ApiError(
      409,
      "CUSTOMER_HAS_BOOKINGS",
      "A customer with booking history cannot be deleted"
    );
  }

  await prisma.user.delete({ where: { id: userId } });

  await recordAuditEntry({
    actorUserId: actor.actorUserId,
    action: "CUSTOMER_DELETED",
    entityType: "User",
    entityId: userId,
    beforeSnapshot: {
      fullName: profile.user.fullName,
      phone: profile.user.phoneNormalized,
      email: profile.user.email,
      status: profile.user.status,
    },
    afterSnapshot: null,
    ipAddress: actor.ipAddress,
    userAgent: actor.userAgent,
  });
}

// FR-041/FR-042/FR-043: Admin-only fields, including internalNotes, which
// must never appear in the Customer-facing serializer above.
export async function updateCustomerAsAdmin(
  userId: string,
  input: UpdateOwnProfileInput & { internalNotes?: string; tags?: string[] }
) {
  const { fullName, email, internalNotes, tags, ...rest } = input;

  await prisma.$transaction([
    ...(fullName !== undefined || email !== undefined
      ? [prisma.user.update({ where: { id: userId }, data: { fullName, email } })]
      : []),
    prisma.customerProfile.update({
      where: { userId },
      data: { ...rest, internalNotes, tags },
    }),
  ]);

  return getOwnProfile(userId);
}
