import { baseApi } from "./baseApi";

export interface PricingRule {
  id: string;
  serviceId: string;
  ruleType: "PROPERTY_TYPE" | "AREA_BAND" | "DAY_TIME" | "CONDITION_MODIFIER";
  conditionsJson: Record<string, unknown>;
  calculationType: "PERCENTAGE" | "FIXED_AMOUNT";
  amount: number;
  priority: number;
  active: boolean;
}

export interface PricingRuleInput {
  serviceId: string;
  ruleType: "PROPERTY_TYPE" | "AREA_BAND" | "DAY_TIME" | "CONDITION_MODIFIER";
  conditionsJson: Record<string, unknown>;
  calculationType: "PERCENTAGE" | "FIXED_AMOUNT";
  amount: number;
  priority?: number;
}

export const pricingRulesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listPricingRules: builder.query<PricingRule[], string>({
      query: (serviceId) => ({ url: "/pricing-rules", params: { serviceId } }),
      providesTags: ["PricingRule"],
    }),
    createPricingRule: builder.mutation<PricingRule, PricingRuleInput>({
      query: (body) => ({ url: "/pricing-rules", method: "POST", body }),
      invalidatesTags: ["PricingRule"],
    }),
    updatePricingRule: builder.mutation<
      PricingRule,
      { id: string; body: Partial<Omit<PricingRuleInput, "serviceId">> & { active?: boolean } }
    >({
      query: ({ id, body }) => ({ url: `/pricing-rules/${id}`, method: "PATCH", body }),
      invalidatesTags: ["PricingRule"],
    }),
    deletePricingRule: builder.mutation<void, string>({
      query: (id) => ({ url: `/pricing-rules/${id}`, method: "DELETE" }),
      invalidatesTags: ["PricingRule"],
    }),
  }),
});

export const {
  useListPricingRulesQuery,
  useCreatePricingRuleMutation,
  useUpdatePricingRuleMutation,
  useDeletePricingRuleMutation,
} = pricingRulesApi;
