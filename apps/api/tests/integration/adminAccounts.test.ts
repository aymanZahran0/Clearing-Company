import bcrypt from "bcrypt";
import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { prisma } from "../../src/lib/prisma.js";

// contracts/admin-accounts.md: list/invite/create/suspend/reactivate/
// reset-credential, plus the last-active-Admin protection (FR-037).
describe("Admin account management (User Story 6)", () => {
  const app = createApp();
  let adminToken: string;
  let adminId: string;

  beforeEach(async () => {
    const admin = await prisma.user.create({
      data: {
        fullName: "Seed Admin",
        email: "seed-admin@example.com",
        passwordHash: await bcrypt.hash("correct-horse-battery", 4),
        role: "ADMIN",
        status: "ACTIVE",
      },
    });
    adminId = admin.id;
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ identifier: "seed-admin@example.com", password: "correct-horse-battery" });
    adminToken = loginRes.body.accessToken;
  });

  it("lists Admin accounts", async () => {
    const res = await request(app).get("/api/v1/admin/accounts").set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.some((a: { id: string }) => a.id === adminId)).toBe(true);
  });

  it("invites a new Admin (status INVITED, no password set)", async () => {
    const res = await request(app)
      .post("/api/v1/admin/accounts/invite")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ fullName: "Invited Admin", email: "invited-admin@example.com" });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("INVITED");
    // The response must never leak passwordHash (even null-vs-populated is
    // more than callers need — see admin-accounts/service.ts's toPublicAdmin).
    expect(res.body).not.toHaveProperty("passwordHash");

    const stored = await prisma.user.findUnique({ where: { email: "invited-admin@example.com" } });
    expect(stored?.passwordHash).toBeNull();
    expect(await prisma.passwordResetToken.count({ where: { userId: stored!.id } })).toBe(1);
  });

  it("rejects inviting a duplicate email", async () => {
    const res = await request(app)
      .post("/api/v1/admin/accounts/invite")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ fullName: "Dup", email: "seed-admin@example.com" });
    expect(res.status).toBe(409);
  });

  it("creates an Admin directly with an active password", async () => {
    const res = await request(app)
      .post("/api/v1/admin/accounts")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ fullName: "Direct Admin", email: "direct-admin@example.com", password: "correct-horse-battery" });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("ACTIVE");
    // The response must never leak the bcrypt hash of the password just set.
    expect(res.body).not.toHaveProperty("passwordHash");

    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ identifier: "direct-admin@example.com", password: "correct-horse-battery" });
    expect(loginRes.status).toBe(200);
  });

  it("suspends and reactivates an active Admin", async () => {
    const second = await prisma.user.create({
      data: {
        fullName: "Second Admin",
        email: "second-admin@example.com",
        passwordHash: await bcrypt.hash("correct-horse-battery", 4),
        role: "ADMIN",
        status: "ACTIVE",
      },
    });

    const suspendRes = await request(app)
      .post(`/api/v1/admin/accounts/${second.id}/suspend`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(suspendRes.status).toBe(200);
    expect(suspendRes.body.status).toBe("SUSPENDED");

    const suspendedLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({ identifier: "second-admin@example.com", password: "correct-horse-battery" });
    expect(suspendedLogin.status).toBe(401);

    const reactivateRes = await request(app)
      .post(`/api/v1/admin/accounts/${second.id}/reactivate`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(reactivateRes.status).toBe(200);
    expect(reactivateRes.body.status).toBe("ACTIVE");
  });

  it("blocks suspending the last active Admin (FR-037)", async () => {
    const res = await request(app)
      .post(`/api/v1/admin/accounts/${adminId}/suspend`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(409);

    const stillActive = await prisma.user.findUnique({ where: { id: adminId } });
    expect(stillActive?.status).toBe("ACTIVE");
  });

  it("resets another Admin's credential (clears password, issues a new token)", async () => {
    const second = await prisma.user.create({
      data: {
        fullName: "Reset Target",
        email: "reset-target@example.com",
        passwordHash: await bcrypt.hash("correct-horse-battery", 4),
        role: "ADMIN",
        status: "ACTIVE",
      },
    });

    const res = await request(app)
      .post(`/api/v1/admin/accounts/${second.id}/reset-credential`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);

    const updated = await prisma.user.findUnique({ where: { id: second.id } });
    expect(updated?.passwordHash).toBeNull();
    expect(await prisma.passwordResetToken.count({ where: { userId: second.id } })).toBe(1);

    const oldLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({ identifier: "reset-target@example.com", password: "correct-horse-battery" });
    expect(oldLogin.status).toBe(401);
  });

  it("rejects a non-Admin caller", async () => {
    const registerRes = await request(app).post("/api/v1/auth/register").send({
      fullName: "Customer",
      phone: "0512340099",
      password: "correct-horse-battery",
    });
    const customerToken = registerRes.body.accessToken;

    const res = await request(app)
      .get("/api/v1/admin/accounts")
      .set("Authorization", `Bearer ${customerToken}`);
    expect(res.status).toBe(403);
  });
});
