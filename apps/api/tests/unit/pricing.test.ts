import { describe, expect, it } from "vitest";
import { calculatePrice } from "../../src/lib/pricing/calculate.js";
import type { PricingContext } from "../../src/lib/pricing/types.js";

const baseFixedContext: PricingContext = {
  service: { pricingType: "FIXED", basePrice: 20000, minimumPrice: null, requiresManualQuote: false },
  addOns: [],
  rules: [],
  travelFee: 0,
  taxRate: 0.15,
};

describe("calculatePrice", () => {
  it("is deterministic: identical input always produces identical output", () => {
    const first = calculatePrice(baseFixedContext);
    const second = calculatePrice(structuredClone(baseFixedContext));
    expect(first).toEqual(second);
  });

  it("computes a FIXED price with tax", () => {
    const result = calculatePrice(baseFixedContext);
    expect(result.subtotal).toBe(20000);
    expect(result.tax).toBe(3000); // 15% of 20000
    expect(result.total).toBe(23000);
    expect(result.requiresManualReview).toBe(false);
  });

  it("flags CUSTOM_QUOTE services for manual review with zero total", () => {
    const result = calculatePrice({
      ...baseFixedContext,
      service: { pricingType: "CUSTOM_QUOTE", basePrice: null, minimumPrice: null, requiresManualQuote: false },
    });
    expect(result.requiresManualReview).toBe(true);
    expect(result.total).toBe(0);
  });

  it("flags services explicitly marked requiresManualQuote even with a base price", () => {
    const result = calculatePrice({
      ...baseFixedContext,
      service: { ...baseFixedContext.service, requiresManualQuote: true },
    });
    expect(result.requiresManualReview).toBe(true);
  });

  it("flags PROPERTY_SIZE/HOURLY/QUANTITY pricing with no quantityOrHours supplied", () => {
    for (const pricingType of ["PROPERTY_SIZE", "HOURLY", "QUANTITY"] as const) {
      const result = calculatePrice({
        ...baseFixedContext,
        service: { pricingType, basePrice: 5000, minimumPrice: null, requiresManualQuote: false },
      });
      expect(result.requiresManualReview).toBe(true);
    }
  });

  it("multiplies basePrice by quantityOrHours for HOURLY pricing", () => {
    const result = calculatePrice({
      ...baseFixedContext,
      service: { pricingType: "HOURLY", basePrice: 5000, minimumPrice: null, requiresManualQuote: false },
      quantityOrHours: 3,
    });
    expect(result.subtotal).toBe(15000);
  });

  it("applies the minimum price floor", () => {
    const result = calculatePrice({
      ...baseFixedContext,
      service: { pricingType: "FIXED", basePrice: 1000, minimumPrice: 5000, requiresManualQuote: false },
    });
    expect(result.subtotal).toBe(5000);
  });

  it("sums FIXED and PER_QUANTITY add-ons correctly", () => {
    const result = calculatePrice({
      ...baseFixedContext,
      addOns: [
        { unitPrice: 1000, pricingMode: "FIXED", quantity: 1 },
        { unitPrice: 500, pricingMode: "PER_QUANTITY", quantity: 4 },
      ],
    });
    expect(result.addOnsTotal).toBe(3000); // 1000 + 500*4
  });

  it("applies matching pricing rules in priority order, skips non-matching ones", () => {
    const result = calculatePrice({
      ...baseFixedContext,
      rules: [
        { calculationType: "PERCENTAGE", amount: 10, priority: 2, matches: true }, // +10%
        { calculationType: "FIXED_AMOUNT", amount: 2000, priority: 1, matches: true }, // +2000 first
        { calculationType: "FIXED_AMOUNT", amount: 99999, priority: 0, matches: false }, // ignored
      ],
    });
    // 20000 -> +2000 (priority 1) = 22000 -> +10% (priority 2) = 24200
    expect(result.subtotal).toBe(20000);
    expect(result.total).toBe(Math.round(24200 * 1.15));
  });

  it("applies a PERCENTAGE discount code above the minimum order value", () => {
    const result = calculatePrice({
      ...baseFixedContext,
      discountCode: { type: "PERCENTAGE", amount: 10, minOrderValue: 10000 },
    });
    expect(result.discount).toBe(2000); // 10% of 20000
  });

  it("ignores a discount code below its minimum order value", () => {
    const result = calculatePrice({
      ...baseFixedContext,
      service: { pricingType: "FIXED", basePrice: 5000, minimumPrice: null, requiresManualQuote: false },
      discountCode: { type: "FIXED", amount: 1000, minOrderValue: 10000 },
    });
    expect(result.discount).toBe(0);
  });

  it("never discounts below zero even if the discount exceeds the subtotal", () => {
    const result = calculatePrice({
      ...baseFixedContext,
      service: { pricingType: "FIXED", basePrice: 1000, minimumPrice: null, requiresManualQuote: false },
      discountCode: { type: "FIXED", amount: 999999, minOrderValue: null },
    });
    expect(result.discount).toBe(1000);
    expect(result.total).toBeGreaterThanOrEqual(0);
  });

  it("adds travel fee before tax so tax applies to the full total", () => {
    const result = calculatePrice({ ...baseFixedContext, travelFee: 1000 });
    expect(result.total).toBe(Math.round((20000 + 1000) * 1.15));
  });
});
