import { baseApi } from "./baseApi";
import type { ServiceAddOn } from "./servicesApi";

export interface ServiceAddOnWritableFields {
  serviceId: string;
  nameAr: string;
  nameEn: string;
  pricingMode?: ServiceAddOn["pricingMode"];
  unitPrice: number;
  durationImpactMinutes?: number;
}

export const serviceAddOnsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listAllAddOns: builder.query<ServiceAddOn[], { serviceId?: string } | void>({
      query: (args) => ({ url: "/service-add-ons", params: { ...args, includeInactive: true } }),
      providesTags: ["Service"],
    }),
    createAddOn: builder.mutation<ServiceAddOn, ServiceAddOnWritableFields>({
      query: (body) => ({ url: "/service-add-ons", method: "POST", body }),
      invalidatesTags: ["Service"],
    }),
    updateAddOn: builder.mutation<
      ServiceAddOn,
      { id: string; body: Partial<ServiceAddOnWritableFields> & { active?: boolean } }
    >({
      query: ({ id, body }) => ({ url: `/service-add-ons/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Service"],
    }),
    deleteAddOn: builder.mutation<void, string>({
      query: (id) => ({ url: `/service-add-ons/${id}`, method: "DELETE" }),
      invalidatesTags: ["Service"],
    }),
    permanentlyDeleteAddOn: builder.mutation<void, string>({
      query: (id) => ({ url: `/service-add-ons/${id}/permanent`, method: "DELETE" }),
      invalidatesTags: ["Service"],
    }),
  }),
});

export const {
  useListAllAddOnsQuery,
  useCreateAddOnMutation,
  useUpdateAddOnMutation,
  useDeleteAddOnMutation,
  usePermanentlyDeleteAddOnMutation,
} = serviceAddOnsApi;
