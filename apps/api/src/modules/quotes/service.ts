import { ApiError } from "@nuqaa-asir/shared";
import { prisma } from "../../lib/prisma.js";
import { calculatePrice } from "../../lib/pricing/calculate.js";
import { matchesRuleConditions } from "../../lib/pricing/matchRule.js";
import type { QuoteEstimateRequest } from "./schema.js";

const QUOTE_TTL_MS = 24 * 60 * 60 * 1000;

async function getTaxRate(): Promise<number> {
  const setting = await prisma.systemSetting.findUnique({ where: { key: "tax_rate" } });
  return typeof setting?.value === "number" ? setting.value : 0.15;
}

export async function estimateQuote(input: QuoteEstimateRequest, customerId?: string) {
  const service = await prisma.service.findUnique({ where: { id: input.serviceId, active: true } });
  if (!service) {
    throw new ApiError(404, "NOT_FOUND", "Service not found");
  }

  let serviceAreaId = input.serviceAreaId;
  if (input.addressId) {
    const address = await prisma.customerAddress.findUnique({ where: { id: input.addressId } });
    if (!address) {
      throw new ApiError(404, "NOT_FOUND", "Address not found");
    }
    serviceAreaId = address.serviceAreaId;
  }
  if (!serviceAreaId) {
    throw new ApiError(422, "VALIDATION_ERROR", "addressId or serviceAreaId is required");
  }
  const serviceArea = await prisma.serviceArea.findUnique({ where: { id: serviceAreaId } });
  if (!serviceArea?.active) {
    throw new ApiError(409, "SERVICE_AREA_UNAVAILABLE", "This area is not currently serviced");
  }

  const addOns = input.addOnIds.length
    ? await prisma.serviceAddOn.findMany({
        where: { id: { in: input.addOnIds }, serviceId: service.id, active: true },
      })
    : [];

  const rules = await prisma.pricingRule.findMany({ where: { serviceId: service.id, active: true } });
  const matchedRules = rules.map((rule) => ({
    calculationType: rule.calculationType,
    amount: Number(rule.amount),
    priority: rule.priority,
    matches: matchesRuleConditions(rule.conditionsJson, {
      propertyType: input.propertyType,
      conditionModifiers: input.propertySizeInput.conditionModifiers,
      requestedDate: input.requestedDate,
    }),
  }));

  const taxRate = await getTaxRate();

  let discountCodeRecord = null;
  if (input.discountCode) {
    discountCodeRecord = await prisma.discountCode.findUnique({ where: { code: input.discountCode } });
    const now = new Date();
    const valid =
      discountCodeRecord?.active &&
      discountCodeRecord.validFrom <= now &&
      discountCodeRecord.validTo >= now &&
      (discountCodeRecord.usageLimit == null || discountCodeRecord.usageCount < discountCodeRecord.usageLimit);
    if (!valid) {
      discountCodeRecord = null; // silently ignore an invalid code in the estimate; /discount-codes/validate gives an explicit error
    }
  }

  const quantityOrHours = input.propertySizeInput.sizeMultiplier;

  const breakdown = calculatePrice({
    service: {
      pricingType: service.pricingType,
      basePrice: service.basePrice,
      minimumPrice: service.minimumPrice,
      requiresManualQuote: service.requiresManualQuote,
    },
    addOns: addOns.map((a) => ({
      unitPrice: a.unitPrice,
      pricingMode: a.pricingMode,
      quantity: 1,
    })),
    rules: matchedRules,
    quantityOrHours,
    travelFee: serviceArea.travelFee,
    taxRate,
    discountCode: discountCodeRecord
      ? {
          type: discountCodeRecord.type,
          amount: Number(discountCodeRecord.amount),
          minOrderValue: discountCodeRecord.minOrderValue,
        }
      : undefined,
  });

  const quote = await prisma.quote.create({
    data: {
      customerId,
      serviceId: service.id,
      addOnIds: input.addOnIds,
      propertyType: input.propertyType,
      propertySizeInput: input.propertySizeInput,
      addressId: input.addressId,
      requestedDate: input.requestedDate,
      requestedTimeSlotId: input.requestedTimeSlotId,
      priceBreakdownJson: { ...breakdown, taxRate },
      requiresManualReview: breakdown.requiresManualReview,
      discountCodeId: discountCodeRecord?.id,
      expiresAt: new Date(Date.now() + QUOTE_TTL_MS),
    },
  });

  return quote;
}

export async function getQuoteById(id: string) {
  const quote = await prisma.quote.findUnique({ where: { id } });
  if (!quote) {
    throw new ApiError(404, "NOT_FOUND", "Quote not found");
  }
  return quote;
}
