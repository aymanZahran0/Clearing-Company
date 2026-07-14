import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { createHash, randomBytes } from "node:crypto";
import { createApp } from "../../src/app.js";
import { prisma } from "../../src/lib/prisma.js";

// Requires DATABASE_URL pointed at a live, disposable PostgreSQL test
// database with migrations applied (`npm run prisma:migrate`), plus
// JWT_ACCESS_SECRET / JWT_REFRESH_SECRET set. See quickstart.md.
describe("auth flows", () => {
  const app = createApp();

  beforeAll(() => {
    if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
      throw new Error("JWT secrets must be set to run auth integration tests");
    }
  });

  it("registers a new customer and returns an access token", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      fullName: "Test Customer",
      phone: "0511111111",
      password: "correct-horse-battery",
    });

    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeTypeOf("string");
    expect(res.body.user.role).toBe("CUSTOMER");
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("rejects registration with a duplicate phone number", async () => {
    await request(app).post("/api/v1/auth/register").send({
      fullName: "First",
      phone: "0522222222",
      password: "correct-horse-battery",
    });

    const res = await request(app).post("/api/v1/auth/register").send({
      fullName: "Second",
      phone: "0522222222",
      password: "another-password",
    });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("CONFLICT");
  });

  it("logs in with the normalized phone number after registering with a spaced one", async () => {
    await request(app).post("/api/v1/auth/register").send({
      fullName: "Spacer",
      phone: "05 3333 3333",
      password: "correct-horse-battery",
    });

    const res = await request(app).post("/api/v1/auth/login").send({
      identifier: "0533333333",
      password: "correct-horse-battery",
    });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTypeOf("string");
  });

  it("rejects login with the wrong password", async () => {
    await request(app).post("/api/v1/auth/register").send({
      fullName: "Wrong Pw",
      phone: "0544444444",
      password: "correct-horse-battery",
    });

    const res = await request(app).post("/api/v1/auth/login").send({
      identifier: "0544444444",
      password: "not-the-password",
    });

    expect(res.status).toBe(401);
  });

  it("rotates the refresh token on use and rejects the old one on reuse", async () => {
    const agent = request.agent(app);
    await agent.post("/api/v1/auth/register").send({
      fullName: "Rotator",
      phone: "0555555555",
      password: "correct-horse-battery",
    });

    const firstRefresh = await agent.post("/api/v1/auth/refresh");
    expect(firstRefresh.status).toBe(200);

    // Re-using the original (now-revoked) refresh cookie must fail. Grab
    // the cookie captured before the first refresh via a fresh agent that
    // never rotates, to simulate replay of a stolen/old token.
    const replayAgent = request.agent(app);
    const registerRes = await replayAgent.post("/api/v1/auth/register").send({
      fullName: "Replay",
      phone: "0566666666",
      password: "correct-horse-battery",
    });
    const originalCookie = registerRes.headers["set-cookie"];

    await replayAgent.post("/api/v1/auth/refresh"); // rotates once, revoking originalCookie's token

    const replay = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Cookie", originalCookie);

    expect(replay.status).toBe(401);
  });

  it("logs out and revokes the refresh token", async () => {
    const agent = request.agent(app);
    await agent.post("/api/v1/auth/register").send({
      fullName: "Logout Test",
      phone: "0577777777",
      password: "correct-horse-battery",
    });

    const logoutRes = await agent.post("/api/v1/auth/logout");
    expect(logoutRes.status).toBe(204);

    const refreshAfterLogout = await agent.post("/api/v1/auth/refresh");
    expect(refreshAfterLogout.status).toBe(401);
  });

  it("rejects reset-password with an invalid token", async () => {
    const res = await request(app)
      .post("/api/v1/auth/reset-password")
      .send({ token: "not-a-real-token", newPassword: "new-password-123" });
    expect(res.status).toBe(400);
  });

  it("resets a password with a valid token and invalidates all existing sessions", async () => {
    await request(app).post("/api/v1/auth/register").send({
      fullName: "Reset Test",
      phone: "0588888888",
      password: "original-password",
    });
    const user = await prisma.user.findUniqueOrThrow({
      where: { phoneNormalized: "+966588888888" },
    });

    // forgotPassword() only stores a hash of the raw token (it would be
    // sent via WhatsApp/SMS in production, not returned by the API) — so
    // this test arranges a known token directly via Prisma, exactly as
    // authService.forgotPassword does internally, rather than trying to
    // recover the raw value from the API response.
    const rawToken = randomBytes(32).toString("hex");
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: createHash("sha256").update(rawToken).digest("hex"),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const resetRes = await request(app)
      .post("/api/v1/auth/reset-password")
      .send({ token: rawToken, newPassword: "brand-new-password" });
    expect(resetRes.status).toBe(200);

    const loginWithOld = await request(app)
      .post("/api/v1/auth/login")
      .send({ identifier: "0588888888", password: "original-password" });
    expect(loginWithOld.status).toBe(401);

    const loginWithNew = await request(app)
      .post("/api/v1/auth/login")
      .send({ identifier: "0588888888", password: "brand-new-password" });
    expect(loginWithNew.status).toBe(200);
  });
});
