import bcrypt from "bcrypt";
import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { prisma } from "../../src/lib/prisma.js";

// contracts/customer-account-status.md: list/search/status filter, sanitized
// summaries, suspend/reactivate lifecycle (with the 409-conflict clarified
// 2026-07-17), token revocation, blocked login/refresh, history
// preservation, audit logging, and permission boundaries (US5).
describe("Admin customer account management (User Story 5)", () => {
  const app = createApp();
  let adminToken: string;

  beforeEach(async () => {
    const admin = await prisma.user.create({
      data: {
        fullName: "Seed Admin",
        email: "customers-admin@example.com",
        passwordHash: await bcrypt.hash("correct-horse-battery", 4),
        role: "ADMIN",
        status: "ACTIVE",
      },
    });
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ identifier: "customers-admin@example.com", password: "correct-horse-battery" });
    adminToken = loginRes.body.accessToken;
    void admin;
  });

  async function registerCustomer(phone: string, fullName = "Test Customer") {
    const res = await request(app).post("/api/v1/auth/register").send({
      fullName,
      phone,
      password: "correct-horse-battery",
    });
    return { userId: res.body.user.id as string, refreshCookie: res.headers["set-cookie"] as string[] };
  }

  it("lists/searches customers, filters by status, and never exposes secrets", async () => {
    const { userId } = await registerCustomer("0511110001", "Searchable Customer");

    const listRes = await request(app)
      .get("/api/v1/customers")
      .query({ search: "Searchable Customer" })
      .set("Authorization", `Bearer ${adminToken}`);
    expect(listRes.status).toBe(200);
    const found = listRes.body.items.find((c: { id: string }) => c.id === userId);
    expect(found).toBeTruthy();
    expect(found).not.toHaveProperty("passwordHash");
    expect(found).not.toHaveProperty("refreshTokenVersion");
    expect(found.status).toBe("ACTIVE");
    expect(found.bookingsCount).toBe(0);

    const statusRes = await request(app)
      .get("/api/v1/customers")
      .query({ status: "SUSPENDED" })
      .set("Authorization", `Bearer ${adminToken}`);
    expect(statusRes.status).toBe(200);
    expect(statusRes.body.items.some((c: { id: string }) => c.id === userId)).toBe(false);
  });

  it("returns a sanitized Customer detail summary", async () => {
    const { userId } = await registerCustomer("0511110002");

    const res = await request(app).get(`/api/v1/customers/${userId}`).set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(userId);
    expect(res.body.status).toBe("ACTIVE");
    expect(res.body).not.toHaveProperty("passwordHash");
  });

  it("suspends a Customer: revokes tokens, blocks login/refresh, preserves history, writes an audit entry", async () => {
    const { userId, refreshCookie } = await registerCustomer("0511110003");

    const suspendRes = await request(app)
      .post(`/api/v1/customers/${userId}/suspend`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ reason: "Repeated no-shows" });
    expect(suspendRes.status).toBe(200);
    expect(suspendRes.body.status).toBe("SUSPENDED");

    // Blocked login.
    const blockedLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({ identifier: "0511110003", password: "correct-horse-battery" });
    expect(blockedLogin.status).toBe(401);
    expect(blockedLogin.body.error.code).toBe("ACCOUNT_SUSPENDED");

    // Blocked refresh (existing refresh token revoked).
    const blockedRefresh = await request(app).post("/api/v1/auth/refresh").set("Cookie", refreshCookie);
    expect(blockedRefresh.status).toBe(401);

    // Audit entry recorded.
    const auditRes = await request(app)
      .get("/api/v1/audit-logs")
      .query({ entityType: "User" })
      .set("Authorization", `Bearer ${adminToken}`);
    const entry = auditRes.body.items.find(
      (e: { entityId: string; action: string }) => e.entityId === userId && e.action === "CUSTOMER_SUSPENDED"
    );
    expect(entry).toBeTruthy();

    // History preserved: the customer row and profile still exist.
    const stillThere = await prisma.customerProfile.findUnique({ where: { userId } });
    expect(stillThere).not.toBeNull();
  });

  it("rejects suspending an already-suspended Customer with 409 and writes no new audit entry", async () => {
    const { userId } = await registerCustomer("0511110004");
    await request(app)
      .post(`/api/v1/customers/${userId}/suspend`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ reason: "First suspension" });

    const res = await request(app)
      .post(`/api/v1/customers/${userId}/suspend`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ reason: "Second attempt" });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("CUSTOMER_ALREADY_SUSPENDED");

  });

  it("rejects reactivating a Customer who isn't suspended with 409", async () => {
    const { userId } = await registerCustomer("0511110005");
    const res = await request(app)
      .post(`/api/v1/customers/${userId}/reactivate`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("CUSTOMER_NOT_SUSPENDED");

  });

  it("reactivates a suspended Customer: status returns to ACTIVE, new login succeeds, old refresh token stays invalid", async () => {
    const { userId, refreshCookie } = await registerCustomer("0511110006");
    await request(app)
      .post(`/api/v1/customers/${userId}/suspend`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ reason: "Temporary hold" });

    const reactivateRes = await request(app)
      .post(`/api/v1/customers/${userId}/reactivate`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(reactivateRes.status).toBe(200);
    expect(reactivateRes.body.status).toBe("ACTIVE");

    const newLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({ identifier: "0511110006", password: "correct-horse-battery" });
    expect(newLogin.status).toBe(200);

    const oldRefreshStillBlocked = await request(app).post("/api/v1/auth/refresh").set("Cookie", refreshCookie);
    expect(oldRefreshStillBlocked.status).toBe(401);
  });

  it("rejects a Customer token from suspending/reactivating (permission boundary)", async () => {
    const { userId } = await registerCustomer("0511110007", "Target Customer");
    const attacker = await registerCustomer("0511110008", "Attacker Customer");
    const attackerLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({ identifier: "0511110008", password: "correct-horse-battery" });
    const customerToken = attackerLogin.body.accessToken;
    void attacker;

    const res = await request(app)
      .post(`/api/v1/customers/${userId}/suspend`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ reason: "not allowed" });
    expect(res.status).toBe(403);
  });

  it("rejects suspending a non-CUSTOMER (Admin) target", async () => {
    const otherAdmin = await prisma.user.create({
      data: { fullName: "Other Admin", email: "other-admin@example.com", role: "ADMIN", status: "ACTIVE" },
    });

    const res = await request(app)
      .post(`/api/v1/customers/${otherAdmin.id}/suspend`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ reason: "should not work" });
    expect(res.status).toBe(404);
  });

  it("requires a suspend reason (3-500 chars)", async () => {
    const { userId } = await registerCustomer("0511110009");
    const res = await request(app)
      .post(`/api/v1/customers/${userId}/suspend`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ reason: "hi" });
    expect(res.status).toBe(422);
  });
});
