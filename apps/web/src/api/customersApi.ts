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

export interface CustomerListResponse {
  items: Customer[];
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
    searchCustomers: builder.query<CustomerListResponse, { search?: string; page?: number }>({
      query: (params) => ({ url: "/customers", params }),
      providesTags: ["Customer"],
    }),
    createCustomer: builder.mutation<Customer, { fullName: string; phone: string }>({
      query: (body) => ({ url: "/customers", method: "POST", body }),
      invalidatesTags: ["Customer"],
    }),
    getCustomer: builder.query<Customer, string>({
      query: (id) => `/customers/${id}`,
      providesTags: ["Customer"],
    }),
    updateCustomer: builder.mutation<Customer, { id: string; body: Partial<Customer> & { internalNotes?: string } }>({
      query: ({ id, body }) => ({ url: `/customers/${id}`, method: "PATCH", body }),
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
} = customersApi;
