import { baseApi } from "./baseApi";

export interface Address {
  id: string;
  label: string | null;
  city: string;
  neighborhood: string;
  street: string | null;
  buildingNumber: string | null;
  unitNumber: string | null;
  landmark: string | null;
  mapUrl: string | null;
  serviceAreaId: string;
  isDefault: boolean;
}

export interface AddressInput {
  label?: string;
  city: string;
  neighborhood: string;
  street?: string;
  buildingNumber?: string;
  unitNumber?: string;
  landmark?: string;
  mapUrl?: string;
  serviceAreaId: string;
  isDefault?: boolean;
}

export const addressesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listOwnAddresses: builder.query<Address[], void>({
      query: () => "/addresses/me",
      providesTags: ["Address"],
    }),
    createOwnAddress: builder.mutation<Address, AddressInput>({
      query: (body) => ({ url: "/addresses/me", method: "POST", body }),
      invalidatesTags: ["Address"],
    }),
    updateOwnAddress: builder.mutation<Address, { id: string; body: Partial<AddressInput> }>({
      query: ({ id, body }) => ({ url: `/addresses/me/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Address"],
    }),
    deleteOwnAddress: builder.mutation<void, string>({
      query: (id) => ({ url: `/addresses/me/${id}`, method: "DELETE" }),
      invalidatesTags: ["Address"],
    }),
    listAddressesForCustomer: builder.query<Address[], string>({
      query: (customerId) => `/customers/${customerId}/addresses`,
      providesTags: ["Address"],
    }),
    createAddressForCustomer: builder.mutation<Address, { customerId: string; body: AddressInput }>({
      query: ({ customerId, body }) => ({
        url: `/customers/${customerId}/addresses`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Address"],
    }),
  }),
});

export const {
  useListOwnAddressesQuery,
  useCreateOwnAddressMutation,
  useUpdateOwnAddressMutation,
  useDeleteOwnAddressMutation,
  useListAddressesForCustomerQuery,
  useCreateAddressForCustomerMutation,
} = addressesApi;
