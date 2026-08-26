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

export const availabilityApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAvailability: builder.query<
      TimeSlot[],
      { serviceId: string; serviceAreaId: string; from?: string; to?: string }
    >({
      query: (params) => ({ url: "/availability", params }),
    }),
    listTimeSlots: builder.query<AdminTimeSlot[], void>({
      query: () => "/time-slots",
      providesTags: ["TimeSlot"],
    }),
  }),
});

export const {
  useGetAvailabilityQuery,
  useListTimeSlotsQuery,
} = availabilityApi;
