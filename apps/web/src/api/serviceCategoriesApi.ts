import { baseApi } from "./baseApi";
import type { ServiceCategory } from "./servicesApi";

export interface ServiceCategoryWritableFields {
  nameAr: string;
  nameEn: string;
  slug: string;
  sortOrder?: number;
}

export const serviceCategoriesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listAllCategories: builder.query<ServiceCategory[], void>({
      query: () => ({ url: "/service-categories", params: { includeInactive: true } }),
      providesTags: ["Service"],
    }),
    createCategory: builder.mutation<ServiceCategory, ServiceCategoryWritableFields>({
      query: (body) => ({ url: "/service-categories", method: "POST", body }),
      invalidatesTags: ["Service"],
    }),
    updateCategory: builder.mutation<
      ServiceCategory,
      { id: string; body: Partial<ServiceCategoryWritableFields> & { active?: boolean } }
    >({
      query: ({ id, body }) => ({ url: `/service-categories/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Service"],
    }),
    deleteCategory: builder.mutation<void, string>({
      query: (id) => ({ url: `/service-categories/${id}`, method: "DELETE" }),
      invalidatesTags: ["Service"],
    }),
  }),
});

export const {
  useListAllCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = serviceCategoriesApi;
