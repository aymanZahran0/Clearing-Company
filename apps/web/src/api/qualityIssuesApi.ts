import { baseApi } from "./baseApi";

export type QualityIssueSeverity = "LOW" | "MEDIUM" | "HIGH";
export type QualityIssueStatus = "OPEN" | "IN_REVIEW" | "RESOLVED" | "CLOSED";

export interface QualityIssue {
  id: string;
  bookingId: string;
  source: "REVIEW" | "COMPLAINT" | "CHECKLIST_FAILURE";
  category: string;
  severity: QualityIssueSeverity;
  description: string;
  status: QualityIssueStatus;
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
  booking: {
    referenceNumber: string;
    preferredDate: string;
    scheduledStartAt: string | null;
    customer: {
      user: {
        fullName: string;
        phoneNormalized: string | null;
        email: string | null;
      };
    };
    items: Array<{ service: { nameAr: string } }>;
    address?: {
      city: string;
      neighborhood: string;
      street: string | null;
    };
  };
}

export const qualityIssuesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createComplaint: builder.mutation<
      QualityIssue,
      { bookingId: string; category: string; description: string }
    >({
      query: ({ bookingId, ...body }) => ({
        url: `/bookings/${bookingId}/complaints`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["QualityIssue", "Booking"],
    }),
    listQualityIssues: builder.query<
      { items: QualityIssue[]; total: number },
      { status?: QualityIssueStatus; source?: "COMPLAINT" } | void
    >({
      query: (args) => ({ url: "/quality-issues", params: args ?? undefined }),
      providesTags: ["QualityIssue"],
    }),
    getQualityIssue: builder.query<QualityIssue, string>({
      query: (id) => `/quality-issues/${id}`,
      providesTags: ["QualityIssue"],
    }),
    updateQualityIssue: builder.mutation<
      QualityIssue,
      { id: string; status?: QualityIssueStatus; resolution?: string }
    >({
      query: ({ id, ...body }) => ({ url: `/quality-issues/${id}`, method: "PATCH", body }),
      invalidatesTags: ["QualityIssue", "Booking"],
    }),
  }),
});

export const {
  useCreateComplaintMutation,
  useListQualityIssuesQuery,
  useGetQualityIssueQuery,
  useUpdateQualityIssueMutation,
} = qualityIssuesApi;
