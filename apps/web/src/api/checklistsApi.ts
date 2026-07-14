import { baseApi } from "./baseApi";

export type ChecklistItemType = "YES_NO" | "TEXT" | "NUMBER" | "SIGNATURE" | "ISSUE_FLAG";

export interface ChecklistTemplateItem {
  id: string;
  labelAr: string;
  labelEn: string;
  type: ChecklistItemType;
  required: boolean;
  sortOrder: number;
}

export interface ChecklistTemplate {
  id: string;
  serviceId: string;
  version: number;
  active: boolean;
  items: ChecklistTemplateItem[];
}

export interface ChecklistResult {
  id: string;
  templateItemId: string;
  value: unknown;
  isIssue: boolean;
  issueNote: string | null;
}

export interface ChecklistRun {
  id: string;
  bookingId: string;
  templateId: string;
  templateVersionSnapshot: number;
  completedByUserId: string | null;
  completedAt: string | null;
  reviewedByUserId: string | null;
  reviewedAt: string | null;
  results: ChecklistResult[];
  template: ChecklistTemplate;
}

export interface ChecklistResultInput {
  templateItemId: string;
  value?: unknown;
  isIssue?: boolean;
  issueNote?: string;
}

export const checklistsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getChecklistTemplate: builder.query<ChecklistTemplate, string>({
      query: (serviceId) => `/services/${serviceId}/checklist-template`,
      providesTags: ["ChecklistTemplate"],
    }),
    upsertChecklistTemplate: builder.mutation<
      ChecklistTemplate,
      { serviceId: string; items: Omit<ChecklistTemplateItem, "id">[] }
    >({
      query: ({ serviceId, items }) => ({
        url: `/services/${serviceId}/checklist-template`,
        method: "PUT",
        body: { items },
      }),
      invalidatesTags: ["ChecklistTemplate"],
    }),
    getChecklistRun: builder.query<ChecklistRun, string>({
      query: (bookingId) => `/bookings/${bookingId}/checklist`,
      providesTags: ["ChecklistRun"],
    }),
    updateChecklistResults: builder.mutation<
      ChecklistRun,
      { bookingId: string; results: ChecklistResultInput[] }
    >({
      query: ({ bookingId, results }) => ({
        url: `/bookings/${bookingId}/checklist`,
        method: "PATCH",
        body: { results },
      }),
      invalidatesTags: ["ChecklistRun"],
    }),
    reviewChecklistRun: builder.mutation<ChecklistRun, string>({
      query: (bookingId) => ({ url: `/bookings/${bookingId}/checklist/review`, method: "POST" }),
      invalidatesTags: ["ChecklistRun"],
    }),
  }),
});

export const {
  useGetChecklistTemplateQuery,
  useUpsertChecklistTemplateMutation,
  useGetChecklistRunQuery,
  useUpdateChecklistResultsMutation,
  useReviewChecklistRunMutation,
} = checklistsApi;
