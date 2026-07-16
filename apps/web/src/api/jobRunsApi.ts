import { baseApi } from "./baseApi";

export type JobName = "EXPIRE_STALE_QUOTES" | "FLAG_OVERDUE_BOOKINGS" | "GENERATE_SUBSCRIPTION_OCCURRENCES";
export type JobRunStatus = "SUCCESS" | "FAILURE" | "SKIPPED_LOCKED";

export interface JobRun {
  id: string;
  jobName: JobName;
  status: JobRunStatus;
  startedAt: string;
  finishedAt: string | null;
  detail: unknown;
  failureReason: string | null;
}

export interface JobRunListResponse {
  items: JobRun[];
  total: number;
  page: number;
  pageSize: number;
}

export const jobRunsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listJobRuns: builder.query<JobRunListResponse, { jobName?: JobName; status?: JobRunStatus; page?: number } | void>(
      {
        query: (args) => ({ url: "/admin/job-runs", params: args ?? undefined }),
        providesTags: ["Report"],
      }
    ),
  }),
});

export const { useListJobRunsQuery } = jobRunsApi;
