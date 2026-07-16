import { prisma } from "../prisma.js";
import type { JobName } from "@prisma/client";

// research.md R2: Postgres session-level advisory locks give mutual
// exclusion across overlapping cron ticks (and across multiple API
// instances sharing one database) without a separate lock table. Each job
// gets a fixed, distinct key.
const LOCK_KEYS: Record<JobName, number> = {
  EXPIRE_STALE_QUOTES: 84001,
  FLAG_OVERDUE_BOOKINGS: 84002,
  GENERATE_SUBSCRIPTION_OCCURRENCES: 84003,
};

export async function tryAdvisoryLock(jobName: JobName): Promise<boolean> {
  const key = LOCK_KEYS[jobName];
  const result = await prisma.$queryRaw<{ locked: boolean }[]>`SELECT pg_try_advisory_lock(${key}) AS locked`;
  return result[0]?.locked ?? false;
}

export async function releaseAdvisoryLock(jobName: JobName): Promise<void> {
  const key = LOCK_KEYS[jobName];
  await prisma.$queryRaw`SELECT pg_advisory_unlock(${key})`;
}
