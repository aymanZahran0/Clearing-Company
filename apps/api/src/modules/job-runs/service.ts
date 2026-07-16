import { prisma } from "../../lib/prisma.js";
import type { ListJobRunsQuery } from "./schema.js";

// contracts/health-and-jobs.md: read-only Admin visibility into job health.
export async function listJobRuns(filters: ListJobRunsQuery) {
  const where = {
    ...(filters.jobName ? { jobName: filters.jobName } : {}),
    ...(filters.status ? { status: filters.status } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.jobRun.findMany({
      where,
      orderBy: { startedAt: "desc" },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
    prisma.jobRun.count({ where }),
  ]);

  return { items, total, page: filters.page, pageSize: filters.pageSize };
}
