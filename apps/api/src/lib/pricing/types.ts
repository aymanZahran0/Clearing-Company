import type { PricingType } from "@nuqaa-asir/shared";

/** All monetary values are integer minor units (halalas) — data-model.md. */

export interface PricingServiceInput {
  pricingType: PricingType;
  basePrice: number | null;
  minimumPrice: number | null;
  requiresManualQuote: boolean;
}

export interface PricingAddOnInput {
  unitPrice: number;
  pricingMode: "FIXED" | "PER_QUANTITY";
  quantity: number;
}

export interface PricingRuleInput {
  calculationType: "PERCENTAGE" | "FIXED_AMOUNT";
  amount: number;
  priority: number;
  /** Whether this rule's conditions match the current booking request. */
  matches: boolean;
}

export interface PricingContext {
  service: PricingServiceInput;
  addOns: PricingAddOnInput[];
  rules: PricingRuleInput[];
  /** Hours for HOURLY pricing, quantity for QUANTITY pricing. */
  quantityOrHours?: number;
  travelFee: number;
  taxRate: number; // e.g. 0.15
  discountCode?: {
    type: "PERCENTAGE" | "FIXED";
    amount: number;
    minOrderValue: number | null;
  };
}

export interface PriceBreakdown {
  subtotal: number;
  addOnsTotal: number;
  discount: number;
  travelFee: number;
  tax: number;
  total: number;
  requiresManualReview: boolean;
}
