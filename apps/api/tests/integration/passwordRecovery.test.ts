import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createHash } from "node:crypto";
import { createApp } from "../../src/app.js";
import { prisma } from "../../src/lib/prisma.js";
import { tryAuthenticate } from "../../src/middleware/tryAuthenticate.js";

const app = createApp();
app.get("/test/optional-auth", tryAuthenticate, (req, res) =>
  res.json({ userId: req.user?.id ?? null })
);
const fetchMock = vi.fn();
const email = "customer@example.com";
const password = "original-password";

beforeEach(() => {
  vi.stubEnv("RESEND_API_KEY", "re_test");
  vi.stubEnv("EMAIL_FROM", "Recovery <no-reply@example.com>");
  vi.stubEnv("WEB_PUBLIC_URL", "https://example.com");
  fetchMock
    .mockReset()
    .mockImplementation(
      async () => new Response(JSON.stringify({ id: "test-email" }), { status: 200 })
    );
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

async function register() {
  const result = await request(app).post("/api/v1/auth/register").send({
    fullName: "Recovery Test",
    phone: "0588888888",
    email,
    password,
  });
  expect(result.status).toBe(201);
  return result;
}

async function requestLink(address = email) {
  const result = await request(app).post("/api/v1/auth/forgot-password").send({ email: address });
  expect(result.status).toBe(202);
  const body = JSON.parse(fetchMock.mock.calls.at(-1)![1].body as string) as {
    text: string;
    to: string[];
  };
  expect(body.to).toEqual([email]);
  const token = body.text.match(/https:\/\/example.com\/reset-password\?token=([a-f0-9]{64})/)?.[1];
  expect(token).toBeDefined();
  expect(JSON.stringify(result.body)).not.toContain(token);
  return token!;
}

function reset(token: string, newPassword = "brand-new-password") {
  return request(app).post("/api/v1/auth/reset-password").send({ token, newPassword });
}

describe("email password recovery", () => {
  it("delivers a link, resets the password and revokes tokens and sessions", async () => {
    const registered = await register();
    const oldLink = await requestLink();
    const token = await requestLink("  CUSTOMER@EXAMPLE.COM  ");
    const stored = await prisma.passwordResetToken.findUniqueOrThrow({
      where: { tokenHash: createHash("sha256").update(token).digest("hex") },
    });
    expect(stored.expiresAt.getTime() - Date.now()).toBeGreaterThan(3_500_000);
    const log = await prisma.notificationLog.findFirstOrThrow();
    expect(log.status).toBe("SENT");
    expect(JSON.stringify(log)).not.toContain(token);

    const result = await reset(token);
    expect(result.status).toBe(200);
    expect(result.headers["set-cookie"].join()).toContain("refreshToken=;");
    expect((await reset(token)).status).toBe(400);
    expect((await reset(oldLink)).status).toBe(400);
    expect(
      (await request(app).post("/api/v1/auth/login").send({ identifier: email, password })).status
    ).toBe(401);
    expect(
      (
        await request(app)
          .post("/api/v1/auth/login")
          .send({ identifier: email, password: "brand-new-password" })
      ).status
    ).toBe(200);
    expect(
      (
        await request(app)
          .post("/api/v1/auth/refresh")
          .set("Cookie", registered.headers["set-cookie"])
      ).status
    ).toBe(401);
    expect(
      (
        await request(app)
          .get("/api/v1/auth/me")
          .auth(registered.body.accessToken, { type: "bearer" })
      ).status
    ).toBe(401);
    const optional = await request(app)
      .get("/test/optional-auth")
      .auth(registered.body.accessToken, { type: "bearer" });
    expect(optional.body.userId).toBeNull();
  });

  it.each(["same link", "different links"])(
    "allows only one concurrent reset using %s",
    async (kind) => {
      await register();
      const first = await requestLink();
      const second = kind === "same link" ? first : await requestLink();
      const results = await Promise.all([
        reset(first, "first-password"),
        reset(second, "second-password"),
      ]);
      expect(results.map((result) => result.status).sort()).toEqual([200, 400]);
      const winner = results[0]!.status === 200 ? "first-password" : "second-password";
      expect(
        (
          await request(app)
            .post("/api/v1/auth/login")
            .send({ identifier: email, password: winner })
        ).status
      ).toBe(200);
    }
  );

  it("rejects expired links without changing the password", async () => {
    await register();
    const token = await requestLink();
    await prisma.passwordResetToken.updateMany({
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    expect((await reset(token)).status).toBe(400);
    expect(
      (await request(app).post("/api/v1/auth/login").send({ identifier: email, password })).status
    ).toBe(200);
  });

  it("invalidates outstanding links when changing a password while signed in", async () => {
    const registered = await register();
    const token = await requestLink();
    const result = await request(app)
      .post("/api/v1/auth/change-password")
      .auth(registered.body.accessToken, { type: "bearer" })
      .send({ oldPassword: password, newPassword: "changed-password" });
    expect(result.status).toBe(200);
    expect((await reset(token)).status).toBe(400);
  });

  it("accepts unknown emails without sending or exposing account existence", async () => {
    const result = await request(app).post("/api/v1/auth/forgot-password").send({ email });
    expect(result.status).toBe(202);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(await prisma.passwordResetToken.count()).toBe(0);
    await register();
    const known = await request(app).post("/api/v1/auth/forgot-password").send({ email });
    expect(known.body).toEqual(result.body);
  });

  it.each(["provider rejection", "network failure", "missing configuration"])(
    "cleans up tokens after %s",
    async (kind) => {
      await register();
      if (kind === "provider rejection")
        fetchMock.mockResolvedValue(new Response("{}", { status: 503 }));
      if (kind === "network failure") fetchMock.mockRejectedValue(new Error("Network unavailable"));
      if (kind === "missing configuration") vi.stubEnv("RESEND_API_KEY", "");
      const result = await request(app).post("/api/v1/auth/forgot-password").send({ email });
      expect(result.status).toBe(202);
      expect(await prisma.passwordResetToken.count()).toBe(0);
      expect((await prisma.notificationLog.findFirstOrThrow()).status).toBe("FAILED");
    }
  );

  it.each([{ email: "0588888888" }, { identifier: "0588888888" }, { email: "bad-email" }, {}])(
    "rejects non-email input %j",
    async (body) => {
      expect((await request(app).post("/api/v1/auth/forgot-password").send(body)).status).toBe(422);
      expect(fetchMock).not.toHaveBeenCalled();
    }
  );

  it("finds legacy mixed-case email accounts", async () => {
    await register();
    await prisma.user.update({ where: { email }, data: { email: "Customer@Example.com" } });
    const result = await request(app).post("/api/v1/auth/forgot-password").send({ email });
    expect(result.status).toBe(202);
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
