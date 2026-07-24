import { baseApi } from "./baseApi";

export type QualityIssueSource = "REVIEW" | "COMPLAINT" | "CHECKLIST_FAILURE";
export type QualityIssueSeverity = "LOW" | "MEDIUM" | "HIGH";
export type QualityIssueStatus = "OPEN" | "IN_REVIEW" | "RESOLVED" | "CLOSED";

export interface QualityIssue {
  id: string;
  bookingId: string;
  source: QualityIssueSource;
  category: string;
  severity: QualityIssueSeverity;
  description: string;
  status: QualityIssueStatus;
  ownerUserId: string | null;
  resolution: string | null;
  reworkBookingId: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

export interface QualityIssueListResponse {
  items: QualityIssue[];
  total: number;
  page: number;
  pageSize: number;
}

export interface QualityAlerts {
  lowRatingCount: number;
  agedOpenIssues: number;
  agedThresholdDays: number;
}

export const qualityIssuesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createComplaint: builder.mutation<
      QualityIssue,
      { bookingId: string; category: string; severity?: QualityIssueSeverity; description: string }
    >({
      query: ({ bookingId, ...body }) => ({ url: `/bookings/${bookingId}/complaints`, method: "POST", body }),
      invalidatesTags: ["QualityIssue", "Booking"],
    }),
    listQualityIssues: builder.query<
      QualityIssueListResponse,
      { status?: QualityIssueStatus; source?: QualityIssueSource } | void
    >({
      query: (args) => ({ url: "/quality-issues", params: args ?? undefined }),
      providesTags: ["QualityIssue"],
    }),
    getQualityAlerts: builder.query<QualityAlerts, void>({
      query: () => "/quality-issues/alerts",
      providesTags: ["QualityIssue"],
    }),
    getQualityIssue: builder.query<QualityIssue, string>({
      query: (id) => `/quality-issues/${id}`,
      providesTags: ["QualityIssue"],
    }),
    updateQualityIssue: builder.mutation<
      QualityIssue,
      {
        id: string;
        category?: string;
        severity?: QualityIssueSeverity;
        ownerUserId?: string;
        status?: QualityIssueStatus;
        resolution?: string;
      }
    >({
      query: ({ id, ...body }) => ({ url: `/quality-issues/${id}`, method: "PATCH", body }),
      invalidatesTags: ["QualityIssue", "Booking"],
    }),
    createReworkBooking: builder.mutation<{ id: string; referenceNumber: string }, string>({
      query: (id) => ({ url: `/quality-issues/${id}/rework`, method: "POST" }),
      invalidatesTags: ["QualityIssue", "Booking"],
    }),
  }),
});

export const {
  useCreateComplaintMutation,
  useListQualityIssuesQuery,
  useGetQualityAlertsQuery,
  useGetQualityIssueQuery,
  useUpdateQualityIssueMutation,
  useCreateReworkBookingMutation,
} = qualityIssuesApi;
