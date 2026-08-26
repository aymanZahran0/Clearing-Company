import { baseApi } from "./baseApi";

export interface OperationsSummary {
  todaysBookings: number;
  unscheduledConfirmed: number;
  overdueBookings: number;
  statusCounts: Partial<Record<import("./bookingsApi").BookingStatus, number>>;
}

export interface RevenueReport {
  completedBookings: number;
  totalRevenue: number;
  totalTax: number;
  totalDiscount: number;
  totalCollected: number;
}

export interface ServiceReportRow {
  nameAr: string;
  nameEn: string;
  count: number;
  revenue: number;
}

export const reportsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOperationsSummary: builder.query<OperationsSummary, void>({
      query: () => "/reports/operations-summary",
      providesTags: ["Report"],
    }),
    getRevenueReport: builder.query<RevenueReport, { from?: string; to?: string } | void>({
      query: (args) => ({ url: "/reports/revenue", params: args ?? undefined }),
      providesTags: ["Report"],
    }),
    getServicesReport: builder.query<ServiceReportRow[], { from?: string; to?: string } | void>({
      query: (args) => ({ url: "/reports/services", params: args ?? undefined }),
      providesTags: ["Report"],
    }),
  }),
});

export const {
  useGetOperationsSummaryQuery,
  useGetRevenueReportQuery,
  useGetServicesReportQuery,
} = reportsApi;
