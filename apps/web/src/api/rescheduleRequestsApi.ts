import { baseApi } from "./baseApi";

export type RescheduleRequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "AUTO_REJECTED";

export interface RescheduleRequest {
  id: string;
  bookingId: string;
  requestedByUserId: string;
  requestedStartAt: string;
  requestedTimeSlotId: string | null;
  status: RescheduleRequestStatus;
  reason: string | null;
  decidedByUserId: string | null;
  decidedAt: string | null;
  createdAt: string;
  booking?: {
    referenceNumber: string;
    scheduledStartAt: string | null;
    customer: { user: { fullName: string } };
  };
}

export interface RescheduleRequestListResponse {
  items: RescheduleRequest[];
  total: number;
  page: number;
  pageSize: number;
}

export const rescheduleRequestsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    submitRescheduleRequest: builder.mutation<
      RescheduleRequest,
      { bookingId: string; requestedStartAt: string; requestedTimeSlotId: string; reason?: string }
    >({
      query: ({ bookingId, ...body }) => ({
        url: `/bookings/${bookingId}/reschedule-requests`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Booking"],
    }),
    listRescheduleRequests: builder.query<
      RescheduleRequestListResponse,
      { status?: RescheduleRequestStatus; page?: number } | void
    >({
      query: (args) => ({ url: "/admin/reschedule-requests", params: args ?? undefined }),
      providesTags: ["Booking"],
    }),
    approveRescheduleRequest: builder.mutation<RescheduleRequest, { id: string; overrideCapacity?: boolean }>({
      query: ({ id, ...body }) => ({ url: `/admin/reschedule-requests/${id}/approve`, method: "POST", body }),
      invalidatesTags: ["Booking"],
    }),
    rejectRescheduleRequest: builder.mutation<RescheduleRequest, { id: string; reason: string }>({
      query: ({ id, reason }) => ({
        url: `/admin/reschedule-requests/${id}/reject`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: ["Booking"],
    }),
  }),
});

export const {
  useSubmitRescheduleRequestMutation,
  useListRescheduleRequestsQuery,
  useApproveRescheduleRequestMutation,
  useRejectRescheduleRequestMutation,
} = rescheduleRequestsApi;
