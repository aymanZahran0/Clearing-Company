import { baseApi } from "./baseApi";

export interface Customer {
  userId: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  preferredChannel: string;
  marketingConsent: boolean;
  customerType: string;
  tags: string[];
}

// US5: Admin-facing list/detail summary (contracts/customer-account-status.md)
// — a distinct shape from the self-service `Customer` profile above.
export interface CustomerSummary {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  status: "ACTIVE" | "INVITED" | "SUSPENDED";
  createdAt: string;
  lastLoginAt: string | null;
  bookingsCount: number;
}

export interface CustomerSummaryListResponse {
  items: CustomerSummary[];
  total: number;
  page: number;
  pageSize: number;
}

export const customersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOwnProfile: builder.query<Customer, void>({
      query: () => "/customers/me",
      providesTags: ["Customer"],
    }),
    updateOwnProfile: builder.mutation<
      Customer,
      { fullName?: string; email?: string; preferredChannel?: string; marketingConsent?: boolean }
    >({
      query: (body) => ({ url: "/customers/me", method: "PATCH", body }),
      invalidatesTags: ["Customer", "User"],
    }),
    searchCustomers: builder.query<
      CustomerSummaryListResponse,
      { search?: string; status?: CustomerSummary["status"]; page?: number; pageSize?: number }
    >({
      query: (params) => ({ url: "/customers", params }),
      providesTags: ["Customer"],
    }),
    createCustomer: builder.mutation<CustomerSummary, { fullName: string; phone: string }>({
      query: (body) => ({ url: "/customers", method: "POST", body }),
      invalidatesTags: ["Customer"],
    }),
    getCustomer: builder.query<CustomerSummary, string>({
      query: (id) => `/customers/${id}`,
      providesTags: ["Customer"],
    }),
    updateCustomer: builder.mutation<Customer, { id: string; body: Partial<Customer> & { internalNotes?: string } }>({
      query: ({ id, body }) => ({ url: `/customers/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Customer"],
    }),
    suspendCustomer: builder.mutation<CustomerSummary, { id: string; reason: string }>({
      query: ({ id, reason }) => ({ url: `/customers/${id}/suspend`, method: "POST", body: { reason } }),
      invalidatesTags: ["Customer"],
    }),
    reactivateCustomer: builder.mutation<CustomerSummary, { id: string; reason?: string }>({
      query: ({ id, reason }) => ({ url: `/customers/${id}/reactivate`, method: "POST", body: { reason } }),
      invalidatesTags: ["Customer"],
    }),
    deleteCustomer: builder.mutation<void, string>({
      query: (id) => ({ url: `/customers/${id}`, method: "DELETE" }),
      invalidatesTags: ["Customer"],
    }),
  }),
});

export const {
  useGetOwnProfileQuery,
  useUpdateOwnProfileMutation,
  useSearchCustomersQuery,
  useCreateCustomerMutation,
  useGetCustomerQuery,
  useUpdateCustomerMutation,
  useSuspendCustomerMutation,
  useReactivateCustomerMutation,
  useDeleteCustomerMutation,
} = customersApi;
