import { baseApi } from "./baseApi";

export interface PriceBreakdown {
  subtotal: number;
  addOnsTotal: number;
  discount: number;
  travelFee: number;
  tax: number;
  total: number;
  requiresManualReview: boolean;
}

export interface Quote {
  id: string;
  priceBreakdownJson: PriceBreakdown;
  requiresManualReview: boolean;
  expiresAt: string;
}

export interface QuoteEstimateRequest {
  serviceId: string;
  addOnIds: string[];
  propertyType: string;
  propertySizeInput: {
    sizeMultiplier?: number;
    rooms?: number;
    areaSqm?: number;
    conditionModifiers: string[];
  };
  addressId?: string;
  serviceAreaId?: string;
  requestedDate: string;
  requestedTimeSlotId?: string;
  discountCode?: string;
}

export const quotesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    estimateQuote: builder.mutation<Quote, QuoteEstimateRequest>({
      query: (body) => ({ url: "/quotes/estimate", method: "POST", body }),
    }),
    validateDiscountCode: builder.mutation<PriceBreakdown, { code: string; quoteId: string }>({
      query: (body) => ({ url: "/discount-codes/validate", method: "POST", body }),
    }),
  }),
});

export const { useEstimateQuoteMutation, useValidateDiscountCodeMutation } = quotesApi;
