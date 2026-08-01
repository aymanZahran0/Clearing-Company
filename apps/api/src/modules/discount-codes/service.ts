import type { Prisma } from "@prisma/client";
import { ApiError } from "@nuqaa-asir/shared";
import { prisma } from "../../lib/prisma.js";
import type {
  CreateDiscountCodeInput,
  UpdateDiscountCodeInput,
  ValidateDiscountCodeInput,
} from "./schema.js";

// T176: full Admin CRUD, completing the read/validate-only path from US1
// (T059's `POST /discount-codes/validate`, which remains unchanged below).
export function listDiscountCodes() {
  return prisma.discountCode.findMany({ orderBy: { code: "asc" } });
}

export function createDiscountCode(input: CreateDiscountCodeInput, createdByUserId: string) {
  return prisma.discountCode.create({ data: { ...input, createdByUserId } });
}

export async function updateDiscountCode(id: string, input: UpdateDiscountCodeInput) {
  const existing = await prisma.discountCode.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "NOT_FOUND", "Discount code not found");
  }
  return prisma.discountCode.update({ where: { id }, data: input });
}

export async function deleteDiscountCode(id: string) {
  const existing = await prisma.discountCode.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "NOT_FOUND", "Discount code not found");
  }
  if (existing.usageCount > 0) {
    throw new ApiError(409, "CONFLICT", "Used discount codes cannot be deleted");
  }
  await prisma.discountCode.delete({ where: { id } });
}

interface StoredBreakdown {
  subtotal: number;
  addOnsTotal: number;
  discount: number;
  travelFee: number;
  tax: number;
  total: number;
  requiresManualReview: boolean;
  taxRate: number;
}

export async function validateDiscountCode(input: ValidateDiscountCodeInput) {
  const [discountCode, quote] = await Promise.all([
    prisma.discountCode.findUnique({ where: { code: input.code } }),
    prisma.quote.findUnique({ where: { id: input.quoteId } }),
  ]);

  if (!quote) {
    throw new ApiError(404, "NOT_FOUND", "Quote not found");
  }

  const now = new Date();
  const valid =
    discountCode?.active &&
    discountCode.validFrom <= now &&
    discountCode.validTo >= now &&
    (discountCode.usageLimit == null || discountCode.usageCount < discountCode.usageLimit);

  if (!discountCode || !valid) {
    throw new ApiError(422, "VALIDATION_ERROR", "Discount code is invalid, expired, or has reached its usage limit");
  }

  const breakdown = quote.priceBreakdownJson as unknown as StoredBreakdown;
  const base = breakdown.subtotal + breakdown.addOnsTotal;

  if (discountCode.minOrderValue != null && base < discountCode.minOrderValue) {
    throw new ApiError(422, "VALIDATION_ERROR", "Order does not meet this code's minimum value");
  }

  const discount =
    discountCode.type === "PERCENTAGE"
      ? Math.round(base * (Number(discountCode.amount) / 100))
      : Math.min(Number(discountCode.amount), base);

  const afterDiscount = base - discount;
  const withTravel = afterDiscount + breakdown.travelFee;
  const tax = Math.round(withTravel * breakdown.taxRate);
  const total = withTravel + tax;

  const updatedBreakdown: StoredBreakdown = { ...breakdown, discount, tax, total };

  await prisma.quote.update({
    where: { id: quote.id },
    data: {
      discountCodeId: discountCode.id,
      priceBreakdownJson: updatedBreakdown as unknown as Prisma.InputJsonValue,
    },
  });

  return updatedBreakdown;
}
