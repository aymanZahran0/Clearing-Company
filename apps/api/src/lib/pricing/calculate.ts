import type { PriceBreakdown, PricingContext } from "./types.js";

/**
 * FR-019: deterministic price calculation — the same PricingContext always
 * produces the same PriceBreakdown (verified by a property-based unit
 * test). FR-020: services requiring manual quote, or with no usable base
 * price for their pricing type, are flagged rather than estimated.
 *
 * Order of operations (research.md R7): base (by pricingType) -> add-ons ->
 * pricing-rule adjustments -> discount code -> travel fee -> tax.
 */
export function calculatePrice(ctx: PricingContext): PriceBreakdown {
  const { service, addOns, rules, quantityOrHours, travelFee, taxRate, discountCode } = ctx;

  let requiresManualReview = service.requiresManualQuote;
  let subtotal = 0;

  switch (service.pricingType) {
    case "FIXED": {
      if (service.basePrice == null) {
        requiresManualReview = true;
      } else {
        subtotal = service.basePrice;
      }
      break;
    }
    case "PROPERTY_SIZE": {
      // basePrice is interpreted as a per-unit-size rate; the caller
      // resolves the actual size multiplier into quantityOrHours before
      // calling this function, keeping this module free of property-type
      // domain knowledge.
      if (service.basePrice == null || !quantityOrHours) {
        requiresManualReview = true;
      } else {
        subtotal = service.basePrice * quantityOrHours;
      }
      break;
    }
    case "HOURLY": {
      if (service.basePrice == null || !quantityOrHours) {
        requiresManualReview = true;
      } else {
        subtotal = service.basePrice * quantityOrHours;
      }
      break;
    }
    case "QUANTITY": {
      if (service.basePrice == null || !quantityOrHours) {
        requiresManualReview = true;
      } else {
        subtotal = service.basePrice * quantityOrHours;
      }
      break;
    }
    case "CUSTOM_QUOTE": {
      requiresManualReview = true;
      break;
    }
  }

  if (service.minimumPrice != null && subtotal < service.minimumPrice && !requiresManualReview) {
    subtotal = service.minimumPrice;
  }

  const addOnsTotal = addOns.reduce((sum, addOn) => {
    const lineTotal =
      addOn.pricingMode === "PER_QUANTITY" ? addOn.unitPrice * addOn.quantity : addOn.unitPrice;
    return sum + lineTotal;
  }, 0);

  let adjusted = subtotal + addOnsTotal;
  const matchingRulesInOrder = rules.filter((r) => r.matches).sort((a, b) => a.priority - b.priority);
  for (const rule of matchingRulesInOrder) {
    adjusted +=
      rule.calculationType === "PERCENTAGE"
        ? Math.round(adjusted * (rule.amount / 100))
        : rule.amount;
  }

  let discount = 0;
  if (discountCode && (discountCode.minOrderValue == null || adjusted >= discountCode.minOrderValue)) {
    discount =
      discountCode.type === "PERCENTAGE"
        ? Math.round(adjusted * (discountCode.amount / 100))
        : discountCode.amount;
    discount = Math.min(discount, adjusted); // never discount below zero
  }

  const afterDiscount = adjusted - discount;
  const withTravelFee = afterDiscount + travelFee;
  const tax = requiresManualReview ? 0 : Math.round(withTravelFee * taxRate);
  const total = withTravelFee + tax;

  return {
    subtotal,
    addOnsTotal,
    discount,
    travelFee,
    tax,
    total: requiresManualReview ? 0 : total,
    requiresManualReview,
  };
}
