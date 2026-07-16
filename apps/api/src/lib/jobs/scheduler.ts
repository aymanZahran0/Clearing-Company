import cron from "node-cron";
import { prisma } from "../prisma.js";
import type { JobName } from "@prisma/client";
import { tryAdvisoryLock, releaseAdvisoryLock } from "./lock.js";
import { expireStaleQuotes } from "../../jobs/expireStaleQuotes.js";
import { flagOverdueBookings } from "../../jobs/flagOverdueBookings.js";
import { generateSubscriptionOccurrences } from "../../jobs/generateSubscriptionOccurrences.js";

// contracts/health-and-jobs.md: every invocation (including lock-skipped
// ones) writes exactly one JobRun row; a thrown error is caught and logged
// as FAILURE rather than crashing the process.
export async function runJob(jobName: JobName, fn: () => Promise<Record<string, unknown>>): Promise<void> {
  const run = await prisma.jobRun.create({
    data: { jobName, startedAt: new Date(), status: "SUCCESS" },
  });

  const acquired = await tryAdvisoryLock(jobName);
  if (!acquired) {
    await prisma.jobRun.update({
      where: { id: run.id },
      data: { status: "SKIPPED_LOCKED", finishedAt: new Date() },
    });
    return;
  }

  try {
    const detail = await fn();
    await prisma.jobRun.update({
      where: { id: run.id },
      data: { status: "SUCCESS", detail: detail as object, finishedAt: new Date() },
    });
  } catch (err) {
    await prisma.jobRun.update({
      where: { id: run.id },
      data: { status: "FAILURE", failureReason: String(err), finishedAt: new Date() },
    });
  } finally {
    await releaseAdvisoryLock(jobName);
  }
}

// spec clarification: every 15 minutes, no additional configuration.
const SCHEDULE = "*/15 * * * *";

export function startScheduler(): void {
  cron.schedule(SCHEDULE, () => {
    void runJob("EXPIRE_STALE_QUOTES", expireStaleQuotes);
  });
  cron.schedule(SCHEDULE, () => {
    void runJob("FLAG_OVERDUE_BOOKINGS", flagOverdueBookings);
  });
  cron.schedule(SCHEDULE, () => {
    void runJob("GENERATE_SUBSCRIPTION_OCCURRENCES", generateSubscriptionOccurrences);
  });
}
