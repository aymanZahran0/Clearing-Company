import { baseApi } from "./baseApi";
import type { ServiceArea } from "./servicesApi";

export interface ServiceAreaWritableFields {
  nameAr: string;
  city?: string;
  travelFee?: number;
}

export const serviceAreasApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listAllServiceAreas: builder.query<ServiceArea[], void>({
      query: () => ({ url: "/service-areas", params: { includeInactive: true } }),
      providesTags: ["Service"],
    }),
    createServiceArea: builder.mutation<ServiceArea, ServiceAreaWritableFields>({
      query: (body) => ({ url: "/service-areas", method: "POST", body }),
      invalidatesTags: ["Service"],
    }),
    updateServiceArea: builder.mutation<
      ServiceArea,
      { id: string; body: Partial<ServiceAreaWritableFields> & { active?: boolean } }
    >({
      query: ({ id, body }) => ({ url: `/service-areas/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Service"],
    }),
    deleteServiceArea: builder.mutation<void, string>({
      query: (id) => ({ url: `/service-areas/${id}`, method: "DELETE" }),
      invalidatesTags: ["Service"],
    }),
    permanentlyDeleteServiceArea: builder.mutation<void, string>({
      query: (id) => ({ url: `/service-areas/${id}/permanent`, method: "DELETE" }),
      invalidatesTags: ["Service"],
    }),
  }),
});

export const {
  useListAllServiceAreasQuery,
  useCreateServiceAreaMutation,
  useUpdateServiceAreaMutation,
  useDeleteServiceAreaMutation,
  usePermanentlyDeleteServiceAreaMutation,
} = serviceAreasApi;
