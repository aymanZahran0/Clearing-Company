import { baseApi } from "./baseApi";

export interface TimeSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  remaining: number;
}

export interface AdminTimeSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  bookedCount: number;
  active: boolean;
}

export interface OperatingHoursEntry {
  weekday: number;
  openTime: string;
  closeTime: string;
  active: boolean;
}

export interface ClosedDateEntry {
  id: string;
  date: string;
  reason: string | null;
}

export const availabilityApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAvailability: builder.query<
      TimeSlot[],
      { serviceId: string; serviceAreaId: string; from?: string; to?: string }
    >({
      query: (params) => ({ url: "/availability", params }),
    }),
    listOperatingHours: builder.query<OperatingHoursEntry[], void>({
      query: () => "/operating-hours",
      providesTags: ["OperatingHours"],
    }),
    replaceOperatingHours: builder.mutation<OperatingHoursEntry[], OperatingHoursEntry[]>({
      query: (body) => ({ url: "/operating-hours", method: "PUT", body }),
      invalidatesTags: ["OperatingHours"],
    }),
    listClosedDates: builder.query<ClosedDateEntry[], void>({
      query: () => "/closed-dates",
      providesTags: ["ClosedDate"],
    }),
    createClosedDate: builder.mutation<ClosedDateEntry, { date: string; reason?: string }>({
      query: (body) => ({ url: "/closed-dates", method: "POST", body }),
      invalidatesTags: ["ClosedDate"],
    }),
    listTimeSlots: builder.query<AdminTimeSlot[], void>({
      query: () => "/time-slots",
      providesTags: ["TimeSlot"],
    }),
    createTimeSlot: builder.mutation<
      AdminTimeSlot,
      { date: string; startTime: string; endTime: string; capacity: number }
    >({
      query: (body) => ({ url: "/time-slots", method: "POST", body }),
      invalidatesTags: ["TimeSlot"],
    }),
    updateTimeSlot: builder.mutation<AdminTimeSlot, { id: string; capacity?: number; active?: boolean }>({
      query: ({ id, ...body }) => ({ url: `/time-slots/${id}`, method: "PATCH", body }),
      invalidatesTags: ["TimeSlot"],
    }),
  }),
});

export const {
  useGetAvailabilityQuery,
  useListOperatingHoursQuery,
  useReplaceOperatingHoursMutation,
  useListClosedDatesQuery,
  useCreateClosedDateMutation,
  useListTimeSlotsQuery,
  useCreateTimeSlotMutation,
  useUpdateTimeSlotMutation,
} = availabilityApi;
