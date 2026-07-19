import { baseApi } from "./baseApi";

export interface PublicStats {
  completedBookingsCount?: number;
  averageRating?: number;
}

export const publicStatsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPublicStats: builder.query<PublicStats, void>({
      query: () => "/public/stats",
    }),
  }),
});

export const { useGetPublicStatsQuery } = publicStatsApi;
