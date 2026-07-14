import { baseApi } from "./baseApi";

export interface CommercialLocation {
  id: string;
  addressId: string;
  label: string | null;
}

export interface Contract {
  id: string;
  startDate: string;
  endDate: string | null;
  pricingTermsJson: Record<string, unknown>;
  documentReference: string | null;
  status: "ACTIVE" | "EXPIRED" | "TERMINATED";
}

export interface CommercialAccount {
  id: string;
  companyName: string;
  billingContactName: string;
  billingContactPhone: string;
  billingContactEmail: string | null;
  notes: string | null;
  locations: CommercialLocation[];
  contracts: Contract[];
}

export interface CreateCommercialAccountInput {
  companyName: string;
  billingContactName: string;
  billingContactPhone: string;
  billingContactEmail?: string;
  notes?: string;
}

export const commercialApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createCommercialAccount: builder.mutation<CommercialAccount, CreateCommercialAccountInput>({
      query: (body) => ({ url: "/commercial-accounts", method: "POST", body }),
      invalidatesTags: ["Commercial"],
    }),
    listCommercialAccounts: builder.query<CommercialAccount[], void>({
      query: () => "/commercial-accounts",
      providesTags: ["Commercial"],
    }),
    getCommercialAccount: builder.query<CommercialAccount, string>({
      query: (id) => `/commercial-accounts/${id}`,
      providesTags: ["Commercial"],
    }),
    updateCommercialAccount: builder.mutation<
      CommercialAccount,
      { id: string; body: Partial<CreateCommercialAccountInput> }
    >({
      query: ({ id, body }) => ({ url: `/commercial-accounts/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Commercial"],
    }),
    addCommercialLocation: builder.mutation<
      CommercialLocation,
      { accountId: string; addressId: string; label?: string }
    >({
      query: ({ accountId, ...body }) => ({
        url: `/commercial-accounts/${accountId}/locations`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Commercial"],
    }),
    createContract: builder.mutation<
      Contract,
      {
        accountId: string;
        startDate: string;
        endDate?: string;
        pricingTerms: Record<string, unknown>;
        documentReference?: string;
      }
    >({
      query: ({ accountId, ...body }) => ({
        url: `/commercial-accounts/${accountId}/contracts`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Commercial"],
    }),
    updateContract: builder.mutation<
      Contract,
      { id: string; body: Partial<Contract> }
    >({
      query: ({ id, body }) => ({ url: `/contracts/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Commercial"],
    }),
  }),
});

export const {
  useCreateCommercialAccountMutation,
  useListCommercialAccountsQuery,
  useGetCommercialAccountQuery,
  useUpdateCommercialAccountMutation,
  useAddCommercialLocationMutation,
  useCreateContractMutation,
  useUpdateContractMutation,
} = commercialApi;
