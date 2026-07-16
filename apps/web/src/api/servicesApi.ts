import { baseApi } from "./baseApi";

export interface ServiceImage {
  id: string;
  url: string;
  altTextAr: string | null;
  altTextEn: string | null;
}

export interface ServiceAddOn {
  id: string;
  serviceId: string;
  nameAr: string;
  nameEn: string;
  pricingMode: "FIXED" | "PER_QUANTITY";
  unitPrice: number;
  durationImpactMinutes: number;
  active: boolean;
}

export interface Service {
  id: string;
  categoryId: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string | null;
  descriptionEn: string | null;
  pricingType: "FIXED" | "PROPERTY_SIZE" | "HOURLY" | "QUANTITY" | "CUSTOM_QUOTE";
  basePrice: number | null;
  minimumPrice: number | null;
  defaultDurationMinutes: number;
  requiresManualQuote: boolean;
  active: boolean;
  images: ServiceImage[];
  addOns: ServiceAddOn[];
}

export interface ServiceWritableFields {
  categoryId: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  pricingType: Service["pricingType"];
  basePrice?: number | null;
  minimumPrice?: number | null;
  defaultDurationMinutes?: number;
  requiresManualQuote?: boolean;
}

export interface ServiceCategory {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  sortOrder: number;
  active: boolean;
}

export interface ServiceArea {
  id: string;
  nameAr: string;
  nameEn: string;
  city: string;
  travelFee: number;
}

export const servicesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listCategories: builder.query<ServiceCategory[], void>({
      query: () => "/service-categories",
    }),
    listServices: builder.query<Service[], { categoryId?: string; includeInactive?: boolean } | void>({
      query: (args) => ({ url: "/services", params: args ?? undefined }),
      providesTags: ["Service"],
    }),
    getServiceBySlug: builder.query<Service, string>({
      query: (slug) => `/services/${slug}`,
      providesTags: ["Service"],
    }),
    createService: builder.mutation<Service, ServiceWritableFields>({
      query: (body) => ({ url: "/services", method: "POST", body }),
      invalidatesTags: ["Service"],
    }),
    updateService: builder.mutation<Service, { id: string; body: Partial<ServiceWritableFields> & { active?: boolean } }>({
      query: ({ id, body }) => ({ url: `/services/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Service"],
    }),
    deleteService: builder.mutation<void, string>({
      query: (id) => ({ url: `/services/${id}`, method: "DELETE" }),
      invalidatesTags: ["Service"],
    }),
    listServiceAreas: builder.query<ServiceArea[], void>({
      query: () => "/service-areas",
    }),
    uploadServiceImage: builder.mutation<
      ServiceImage,
      { serviceId: string; file: File; altTextAr?: string; altTextEn?: string }
    >({
      query: ({ serviceId, file, altTextAr, altTextEn }) => {
        const formData = new FormData();
        formData.append("image", file);
        if (altTextAr) formData.append("altTextAr", altTextAr);
        if (altTextEn) formData.append("altTextEn", altTextEn);
        return { url: `/services/${serviceId}/images`, method: "POST", body: formData };
      },
      invalidatesTags: ["Service"],
    }),
    deleteServiceImage: builder.mutation<void, string>({
      query: (id) => ({ url: `/service-images/${id}`, method: "DELETE" }),
      invalidatesTags: ["Service"],
    }),
  }),
});

export const {
  useListCategoriesQuery,
  useListServicesQuery,
  useGetServiceBySlugQuery,
  useListServiceAreasQuery,
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useDeleteServiceMutation,
  useUploadServiceImageMutation,
  useDeleteServiceImageMutation,
} = servicesApi;
