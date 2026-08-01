import cron from "node-cron";
import { tryAdvisoryLock, releaseAdvisoryLock, type JobName } from "./lock.js";
import { expireStaleQuotes } from "../../jobs/expireStaleQuotes.js";
import { generateSubscriptionOccurrences } from "../../jobs/generateSubscriptionOccurrences.js";

export async function runJob(jobName: JobName, fn: () => Promise<Record<string, unknown>>): Promise<void> {
  const acquired = await tryAdvisoryLock(jobName);
  if (!acquired) return;

  try {
    await fn();
  } catch (err) {
    console.error(`Scheduled job ${jobName} failed`, err);
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
    void runJob("GENERATE_SUBSCRIPTION_OCCURRENCES", generateSubscriptionOccurrences);
  });
}
