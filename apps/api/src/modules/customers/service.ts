import { prisma } from "../../lib/prisma.js";
import { ApiError } from "@nuqaa-asir/shared";
import { normalizeSaudiPhone } from "../../lib/phoneNormalization.js";
import type { UpdateOwnProfileInput } from "./schema.js";

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

// FR-017: Admin searches by (normalized) phone number. Customers are stored
// in E.164 (phoneNormalized), but Admins naturally type the local format
// (05XXXXXXXX) — a full valid number is normalized before matching so that
// natural-format input actually finds the customer; a partial/non-phone
// search term still falls through to a raw substring match.
export async function searchCustomers(search: string | undefined, page: number, pageSize: number) {
  const normalizedPhone = search ? tryNormalizePhone(search) : null;
  const where = search
    ? {
        OR: [
          { user: { phoneNormalized: { contains: normalizedPhone ?? search } } },
          { user: { fullName: { contains: search, mode: "insensitive" as const } } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.customerProfile.findMany({
      where,
      include: { user: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.customerProfile.count({ where }),
  ]);

  return { items: items.map(toPublicCustomer), total, page, pageSize };
}

export async function getCustomerById(userId: string) {
  return getOwnProfile(userId);
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
