import { baseApi } from "./baseApi";

export interface DiscountCode {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED";
  amount: number;
  minOrderValue: number | null;
  validFrom: string;
  validTo: string;
  usageLimit: number | null;
  usageCount: number;
  active: boolean;
}

export interface DiscountCodeInput {
  code: string;
  type: "PERCENTAGE" | "FIXED";
  amount: number;
  minOrderValue?: number;
  validFrom: string;
  validTo: string;
  usageLimit?: number;
}

export const discountCodesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listDiscountCodes: builder.query<DiscountCode[], void>({
      query: () => "/discount-codes",
      providesTags: ["DiscountCode"],
    }),
    createDiscountCode: builder.mutation<DiscountCode, DiscountCodeInput>({
      query: (body) => ({ url: "/discount-codes", method: "POST", body }),
      invalidatesTags: ["DiscountCode"],
    }),
    updateDiscountCode: builder.mutation<
      DiscountCode,
      { id: string; body: Partial<DiscountCodeInput> & { active?: boolean } }
    >({
      query: ({ id, body }) => ({ url: `/discount-codes/${id}`, method: "PATCH", body }),
      invalidatesTags: ["DiscountCode"],
    }),
    disableDiscountCode: builder.mutation<void, string>({
      query: (id) => ({ url: `/discount-codes/${id}`, method: "DELETE" }),
      invalidatesTags: ["DiscountCode"],
    }),
  }),
});

export const {
  useListDiscountCodesQuery,
  useCreateDiscountCodeMutation,
  useUpdateDiscountCodeMutation,
  useDisableDiscountCodeMutation,
} = discountCodesApi;
