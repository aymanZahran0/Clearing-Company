import { baseApi } from "./baseApi";

export interface ContentBlock {
  id: string;
  key: string;
  type: "PAGE" | "SECTION";
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  sortOrder: number;
  active: boolean;
}

export interface ContentBlockInput {
  key: string;
  type: "PAGE" | "SECTION";
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  sortOrder?: number;
  active?: boolean;
}

export interface FaqItem {
  id: string;
  questionAr: string;
  questionEn: string;
  answerAr: string;
  answerEn: string;
  sortOrder: number;
  active: boolean;
}

export interface FaqItemInput {
  questionAr: string;
  questionEn: string;
  answerAr: string;
  answerEn: string;
  sortOrder?: number;
  active?: boolean;
}

export const contentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listAllContentBlocks: builder.query<ContentBlock[], void>({
      query: () => "/admin/content-blocks",
      providesTags: ["ContentBlock"],
    }),
    upsertContentBlock: builder.mutation<ContentBlock, ContentBlockInput>({
      query: (body) => ({ url: "/admin/content-blocks", method: "PUT", body }),
      invalidatesTags: ["ContentBlock"],
    }),
    deleteContentBlock: builder.mutation<void, string>({
      query: (id) => ({ url: `/admin/content-blocks/${id}`, method: "DELETE" }),
      invalidatesTags: ["ContentBlock"],
    }),
    listAllFaqs: builder.query<FaqItem[], void>({
      query: () => "/admin/faqs",
      providesTags: ["Faq"],
    }),
    createFaqItem: builder.mutation<FaqItem, FaqItemInput>({
      query: (body) => ({ url: "/admin/faqs", method: "POST", body }),
      invalidatesTags: ["Faq"],
    }),
    updateFaqItem: builder.mutation<FaqItem, { id: string; body: Partial<FaqItemInput> }>({
      query: ({ id, body }) => ({ url: `/admin/faqs/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Faq"],
    }),
    deleteFaqItem: builder.mutation<void, string>({
      query: (id) => ({ url: `/admin/faqs/${id}`, method: "DELETE" }),
      invalidatesTags: ["Faq"],
    }),
  }),
});

export const {
  useListAllContentBlocksQuery,
  useUpsertContentBlockMutation,
  useDeleteContentBlockMutation,
  useListAllFaqsQuery,
  useCreateFaqItemMutation,
  useUpdateFaqItemMutation,
  useDeleteFaqItemMutation,
} = contentApi;
