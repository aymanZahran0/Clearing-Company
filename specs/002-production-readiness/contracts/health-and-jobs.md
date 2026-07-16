# Contract: Health Check & Job Run Visibility

## GET /api/v1/health (existing path, extended behavior)

Existing handler: `apps/api/src/app.ts:50`. Currently liveness-only; already relied on by `playwright.config.ts`'s `webServer` readiness probe, so the **path and 200-on-healthy contract must not change**.

**New response body**:
```ts
{ status: "ok" | "degraded", db: boolean, timestamp: string }
```
`db` is the result of a `SELECT 1` via Prisma with a short timeout. `status = "degraded"` (still HTTP 200, so orchestrators don't hard-kill on a transient DB blip, but monitoring can alert on the field) when `db === false`; existing Playwright usage only checks HTTP status, so it is unaffected by the body change.

## GET /admin/job-runs

New endpoint, new router file `apps/api/src/modules/job-runs/routes.ts` (thin — read-only), `authenticate` + `requireRole("ADMIN")`.

**Query**: `?jobName=EXPIRE_STALE_QUOTES|FLAG_OVERDUE_BOOKINGS|GENERATE_SUBSCRIPTION_OCCURRENCES`, `?status=SUCCESS|FAILURE|SKIPPED_LOCKED`, pagination.

**Response**: paginated `JobRun[]` (data-model.md §2) ordered by `startedAt desc` — satisfies FR-041 ("Admin can review job run history") and gives an external monitor/alerting rule (research.md R15) something to poll for job-health alerting.

## Internal contract: job wrapper

`apps/api/src/lib/jobs/scheduler.ts` registers each of the three existing job functions (`apps/api/src/jobs/{expireStaleQuotes,flagOverdueBookings,generateSubscriptionOccurrences}.ts`) through one wrapper, `runJob(jobName, fn)`, in `apps/api/src/lib/jobs/lock.ts`:

```ts
async function runJob(jobName: JobName, fn: () => Promise<Record<string, unknown>>): Promise<void> {
  const run = await prisma.jobRun.create({ data: { jobName, startedAt: new Date(), status: "SUCCESS" /* placeholder, updated below */ } });
  const acquired = await tryAdvisoryLock(jobName);
  if (!acquired) {
    await prisma.jobRun.update({ where: { id: run.id }, data: { status: "SKIPPED_LOCKED", finishedAt: new Date() } });
    return;
  }
  try {
    const detail = await fn();
    await prisma.jobRun.update({ where: { id: run.id }, data: { status: "SUCCESS", detail, finishedAt: new Date() } });
  } catch (err) {
    await prisma.jobRun.update({ where: { id: run.id }, data: { status: "FAILURE", failureReason: String(err), finishedAt: new Date() } });
  } finally {
    await releaseAdvisoryLock(jobName);
  }
}
```

This is the contract every job-file must satisfy: **no change to the three existing job files' exported function signatures** — each already returns a plain summary object usable as `detail`, per research.md R1/R2.
