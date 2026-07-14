import { baseApi } from "./baseApi";

export type BookingStatus =
  | "DRAFT"
  | "PENDING"
  | "CONFIRMED"
  | "RESCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "REJECTED"
  | "COMPLAINT_OPENED";

export interface Booking {
  id: string;
  referenceNumber: string;
  status: BookingStatus;
  customerId: string;
  addressId: string;
  propertyType: string;
  scheduledTimeSlotId: string | null;
  scheduledStartAt: string | null;
  scheduledEndAt: string | null;
  internalHandlingNote: string | null;
  enRouteAt: string | null;
  arrivedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  totalSnapshot: number | null;
  currency: string;
  createdAt: string;
}

export interface BookingCreateRequest {
  quoteId: string;
  addressId: string;
  propertyType: string;
  propertyDetails?: Record<string, unknown>;
  preferredDate: string;
  preferredTimeSlotId?: string;
  contactName: string;
  contactPhone: string;
  customerNotes?: string;
  consentAccepted: true;
}

export interface AdminBookingCreateRequest extends BookingCreateRequest {
  customerId?: string;
  newCustomer?: { fullName: string; phone: string };
}

export interface BookingListResponse {
  items: Booking[];
  total: number;
  page: number;
  pageSize: number;
}

export const bookingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createBooking: builder.mutation<Booking, { body: BookingCreateRequest; idempotencyKey: string }>({
      query: ({ body, idempotencyKey }) => ({
        url: "/bookings",
        method: "POST",
        body,
        headers: { "Idempotency-Key": idempotencyKey },
      }),
      invalidatesTags: ["Booking"],
    }),
    listOwnBookings: builder.query<BookingListResponse, { status?: BookingStatus } | void>({
      query: (args) => ({ url: "/bookings", params: args ?? undefined }),
      providesTags: ["Booking"],
    }),
    getBooking: builder.query<Booking, string>({
      query: (id) => `/bookings/${id}`,
      providesTags: ["Booking"],
    }),
    createAdminBooking: builder.mutation<
      Booking,
      { body: AdminBookingCreateRequest; idempotencyKey?: string }
    >({
      query: ({ body, idempotencyKey }) => ({
        url: "/bookings/admin",
        method: "POST",
        body,
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
      }),
      invalidatesTags: ["Booking"],
    }),
    listAllBookings: builder.query<
      BookingListResponse,
      | {
          status?: BookingStatus;
          page?: number;
          from?: string;
          to?: string;
          scheduledFrom?: string;
          scheduledTo?: string;
          needsScheduling?: boolean;
        }
      | void
    >({
      query: (args) => ({ url: "/bookings", params: args ?? undefined }),
      providesTags: ["Booking"],
    }),
    getBookingByReference: builder.query<
      { referenceNumber: string; status: BookingStatus; scheduledStartAt: string | null; serviceName: string },
      { referenceNumber: string; token: string }
    >({
      query: ({ referenceNumber, token }) => ({
        url: `/bookings/reference/${referenceNumber}`,
        params: { token },
      }),
    }),
    confirmBooking: builder.mutation<
      Booking,
      { id: string; priceOverride?: number; priceOverrideReason?: string }
    >({
      query: ({ id, ...body }) => ({ url: `/bookings/${id}/confirm`, method: "POST", body }),
      invalidatesTags: ["Booking"],
    }),
    rejectBooking: builder.mutation<Booking, { id: string; reason: string }>({
      query: ({ id, reason }) => ({ url: `/bookings/${id}/reject`, method: "POST", body: { reason } }),
      invalidatesTags: ["Booking"],
    }),
    getBookingHistory: builder.query<
      Array<{ fromStatus: BookingStatus | null; toStatus: BookingStatus; reason: string | null; createdAt: string }>,
      string
    >({
      query: (id) => `/bookings/${id}/history`,
    }),
    scheduleBooking: builder.mutation<
      Booking,
      { id: string; timeSlotId: string; internalHandlingNote?: string; overrideCapacity?: boolean }
    >({
      query: ({ id, ...body }) => ({ url: `/bookings/${id}/schedule`, method: "POST", body }),
      invalidatesTags: ["Booking"],
    }),
    rescheduleBooking: builder.mutation<
      Booking,
      { id: string; timeSlotId: string; internalHandlingNote?: string; overrideCapacity?: boolean }
    >({
      query: ({ id, ...body }) => ({ url: `/bookings/${id}/reschedule`, method: "POST", body }),
      invalidatesTags: ["Booking"],
    }),
    cancelBooking: builder.mutation<Booking, { id: string; reason: string }>({
      query: ({ id, reason }) => ({ url: `/bookings/${id}/cancel`, method: "POST", body: { reason } }),
      invalidatesTags: ["Booking"],
    }),
    markEnRoute: builder.mutation<Booking, string>({
      query: (id) => ({ url: `/bookings/${id}/en-route`, method: "POST" }),
      invalidatesTags: ["Booking"],
    }),
    markArrived: builder.mutation<Booking, string>({
      query: (id) => ({ url: `/bookings/${id}/arrive`, method: "POST" }),
      invalidatesTags: ["Booking"],
    }),
    startExecution: builder.mutation<Booking, string>({
      query: (id) => ({ url: `/bookings/${id}/start`, method: "POST" }),
      invalidatesTags: ["Booking"],
    }),
    completeBooking: builder.mutation<Booking, string>({
      query: (id) => ({ url: `/bookings/${id}/complete`, method: "POST" }),
      invalidatesTags: ["Booking"],
    }),
  }),
});

export const {
  useCreateBookingMutation,
  useCreateAdminBookingMutation,
  useListOwnBookingsQuery,
  useListAllBookingsQuery,
  useGetBookingQuery,
  useGetBookingByReferenceQuery,
  useConfirmBookingMutation,
  useRejectBookingMutation,
  useGetBookingHistoryQuery,
  useScheduleBookingMutation,
  useRescheduleBookingMutation,
  useCancelBookingMutation,
  useMarkEnRouteMutation,
  useMarkArrivedMutation,
  useStartExecutionMutation,
  useCompleteBookingMutation,
} = bookingsApi;
