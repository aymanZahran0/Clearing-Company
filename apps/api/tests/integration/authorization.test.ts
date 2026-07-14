import { describe, expect, it } from "vitest";
import request from "supertest";
import { Router } from "express";
import { createApp } from "../../src/app.js";
import { authenticate } from "../../src/middleware/authenticate.js";
import { requireRole } from "../../src/middleware/requireRole.js";
import { asyncHandler } from "../../src/lib/asyncHandler.js";

// Exercises FR-003 (server-side role enforcement) against a throwaway
// Admin-only test route, since no real Admin-only business route exists
// yet in Foundational — Phase 3+ integration tests exercise the same
// authenticate/requireRole pair against real routes (e.g. bookings.admin.test.ts).
describe("authorization boundary", () => {
  const app = createApp();
  const testRouter = Router();
  testRouter.get("/admin-only", authenticate, requireRole("ADMIN"), asyncHandler(async (_req, res) => {
    res.json({ ok: true });
  }));
  app.use("/api/v1/_test", testRouter);

  it("returns 401 for an unauthenticated request to an Admin-only route", async () => {
    const res = await request(app).get("/api/v1/_test/admin-only");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 403 for a CUSTOMER token on an Admin-only route", async () => {
    const registerRes = await request(app).post("/api/v1/auth/register").send({
      fullName: "Customer Boundary",
      phone: "0599999991",
      password: "correct-horse-battery",
    });
    const token = registerRes.body.accessToken as string;

    const res = await request(app)
      .get("/api/v1/_test/admin-only")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("returns 401 for a malformed/garbage bearer token", async () => {
    const res = await request(app)
      .get("/api/v1/_test/admin-only")
      .set("Authorization", "Bearer not-a-real-jwt");
    expect(res.status).toBe(401);
  });
});
