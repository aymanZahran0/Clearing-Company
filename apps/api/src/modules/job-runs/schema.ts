import { z } from "zod";

export const listJobRunsQuerySchema = z.object({
  jobName: z.enum(["EXPIRE_STALE_QUOTES", "FLAG_OVERDUE_BOOKINGS", "GENERATE_SUBSCRIPTION_OCCURRENCES"]).optional(),
  status: z.enum(["SUCCESS", "FAILURE", "SKIPPED_LOCKED"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListJobRunsQuery = z.infer<typeof listJobRunsQuerySchema>;
