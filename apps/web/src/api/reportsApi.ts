import { baseApi } from "./baseApi";

export interface OperationsSummary {
  todaysBookings: number;
  unscheduledConfirmed: number;
  overdueBookings: number;
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

export interface QualityReport {
  averageRating: number | null;
  reviewCount: number;
  issuesByStatus: Array<{ status: string; count: number }>;
}

export interface AuditLogEntry {
  id: string;
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeSnapshotJson: unknown;
  afterSnapshotJson: unknown;
  createdAt: string;
}

export interface AuditLogListResponse {
  items: AuditLogEntry[];
  total: number;
  page: number;
  pageSize: number;
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
    getQualityReport: builder.query<QualityReport, void>({
      query: () => "/reports/quality",
      providesTags: ["Report"],
    }),
    listAuditLogs: builder.query<AuditLogListResponse, { entityType?: string; page?: number } | void>({
      query: (args) => ({ url: "/audit-logs", params: args ?? undefined }),
      providesTags: ["Report"],
    }),
  }),
});

export const {
  useGetOperationsSummaryQuery,
  useGetRevenueReportQuery,
  useGetServicesReportQuery,
  useGetQualityReportQuery,
  useListAuditLogsQuery,
} = reportsApi;
