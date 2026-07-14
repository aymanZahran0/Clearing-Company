import { baseApi } from "./baseApi";

export interface Review {
  id: string;
  bookingId: string;
  customerId: string;
  rating: number;
  comment: string | null;
  submittedAt: string;
  followUpRequired: boolean;
}

export const reviewsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createReview: builder.mutation<Review, { bookingId: string; rating: number; comment?: string }>({
      query: ({ bookingId, ...body }) => ({ url: `/bookings/${bookingId}/review`, method: "POST", body }),
      invalidatesTags: ["Review", "Booking"],
    }),
  }),
});

export const { useCreateReviewMutation } = reviewsApi;
