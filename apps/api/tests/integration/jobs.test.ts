import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { prisma } from "../../src/lib/prisma.js";
import { runJob } from "../../src/lib/jobs/scheduler.js";

// FLAG_OVERDUE_BOOKINGS's fixed advisory-lock key (see lib/jobs/lock.ts).
const FLAG_OVERDUE_BOOKINGS_LOCK_KEY = 84002;

// contracts/health-and-jobs.md: every job invocation (including
// lock-skipped and failed ones) writes exactly one JobRun row, surfaced
// read-only to Admins via GET /admin/job-runs.
describe("Background job scheduler (User Story 7)", () => {
  const app = createApp();
  let adminToken: string;

  beforeEach(async () => {
    await prisma.user.create({
      data: {
        fullName: "Seed Admin",
        email: "jobs-admin@example.com",
        passwordHash: await bcrypt.hash("correct-horse-battery", 4),
        role: "ADMIN",
        status: "ACTIVE",
      },
    });
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ identifier: "jobs-admin@example.com", password: "correct-horse-battery" });
    adminToken = loginRes.body.accessToken;
  });

  it("records a SUCCESS run and surfaces it via GET /admin/job-runs", async () => {
    await runJob("EXPIRE_STALE_QUOTES", async () => ({ expired: 0 }));

    const res = await request(app)
      .get("/api/v1/admin/job-runs")
      .query({ jobName: "EXPIRE_STALE_QUOTES" })
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);
    const latest = res.body.items[0];
    expect(latest.jobName).toBe("EXPIRE_STALE_QUOTES");
    expect(latest.status).toBe("SUCCESS");
    expect(latest.finishedAt).not.toBeNull();
  });

  it("records SKIPPED_LOCKED when the advisory lock is already held", async () => {
    // pg_try_advisory_lock is session-scoped and reentrant within the same
    // session, so holding it via the app's own (pooled) Prisma client would
    // let runJob's internal lock attempt succeed again. Use a genuinely
    // separate connection to simulate a concurrent cron tick.
    const lockHolder = new PrismaClient();
    try {
      // pg_advisory_lock returns void, which $queryRaw can't deserialize —
      // $executeRaw only reports affected-row count, so it's fine here.
      await lockHolder.$executeRaw`SELECT pg_advisory_lock(${FLAG_OVERDUE_BOOKINGS_LOCK_KEY})`;

      await runJob("FLAG_OVERDUE_BOOKINGS", async () => ({ flagged: 0 }));

      const res = await request(app)
        .get("/api/v1/admin/job-runs")
        .query({ jobName: "FLAG_OVERDUE_BOOKINGS", status: "SKIPPED_LOCKED" })
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.items.length).toBeGreaterThan(0);
      expect(res.body.items[0].status).toBe("SKIPPED_LOCKED");
    } finally {
      await lockHolder.$queryRaw`SELECT pg_advisory_unlock(${FLAG_OVERDUE_BOOKINGS_LOCK_KEY})`;
      await lockHolder.$disconnect();
    }
  });

  it("records a FAILURE run with failureReason when the job throws", async () => {
    await runJob("GENERATE_SUBSCRIPTION_OCCURRENCES", async () => {
      throw new Error("forced failure for test");
    });

    const res = await request(app)
      .get("/api/v1/admin/job-runs")
      .query({ jobName: "GENERATE_SUBSCRIPTION_OCCURRENCES", status: "FAILURE" })
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);
    const latest = res.body.items[0];
    expect(latest.status).toBe("FAILURE");
    expect(latest.failureReason).toContain("forced failure for test");
  });

  it("rejects a non-Admin caller", async () => {
    const registerRes = await request(app).post("/api/v1/auth/register").send({
      fullName: "Customer",
      phone: "0512340098",
      password: "correct-horse-battery",
    });
    const customerToken = registerRes.body.accessToken;

    const res = await request(app).get("/api/v1/admin/job-runs").set("Authorization", `Bearer ${customerToken}`);
    expect(res.status).toBe(403);
  });
});
