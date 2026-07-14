import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";
import { createApp } from "../../src/app.js";
import { prisma } from "../../src/lib/prisma.js";
import { generateSubscriptionOccurrences } from "../../src/jobs/generateSubscriptionOccurrences.js";

// Requires a live PostgreSQL test database.
describe("Subscription pause/cancel and single-occurrence editing (User Story 7)", () => {
  const app = createApp();
  let adminToken: string;

  beforeEach(async () => {
    await prisma.user.create({
      data: {
        fullName: "Subscription Admin",
        email: "subscription-admin@example.com",
        passwordHash: await bcrypt.hash("correct-horse-battery", 4),
        role: "ADMIN",
      },
    });
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ identifier: "subscription-admin@example.com", password: "correct-horse-battery" });
    adminToken = loginRes.body.accessToken;
  });

  async function createActiveSubscription() {
    const area = await prisma.serviceArea.create({
      data: { nameAr: "أ", nameEn: "Abha", city: "Abha", travelFee: 0, active: true },
    });
    const category = await prisma.serviceCategory.create({
      data: { nameAr: "أ", nameEn: "Cleaning", slug: `sub-lifecycle-cleaning-${Date.now()}` },
    });
    const svc = await prisma.service.create({
      data: {
        categoryId: category.id,
        slug: `sub-lifecycle-service-${Date.now()}`,
        nameAr: "أ",
        nameEn: "Subscription Service",
        pricingType: "FIXED",
        basePrice: 20000,
      },
    });
    const registerRes = await request(app).post("/api/v1/auth/register").send({
      fullName: "Subscription Customer",
      phone: `05${Math.floor(10000000 + Math.random() * 89999999)}`,
      password: "correct-horse-battery",
    });
    const customerToken = registerRes.body.accessToken;
    const me = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${customerToken}`);

    const addressRes = await request(app)
      .post("/api/v1/addresses/me")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ city: "Abha", neighborhood: "Al Numan", serviceAreaId: area.id });

    const subscriptionRes = await request(app)
      .post("/api/v1/subscriptions")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        customerId: me.body.id,
        addressId: addressRes.body.id,
        serviceConfiguration: { serviceId: svc.id, addOnIds: [] },
        frequency: "WEEKLY",
        priceSnapshot: 20000,
        startsAt: new Date().toISOString(),
      });

    return subscriptionRes.body;
  }

  it("preserves prior generated bookings when a subscription is cancelled", async () => {
    const subscription = await createActiveSubscription();
    await generateSubscriptionOccurrences();

    const beforeCancel = await prisma.booking.count({ where: { subscriptionId: subscription.id } });
    expect(beforeCancel).toBeGreaterThan(0);

    await request(app)
      .post(`/api/v1/subscriptions/${subscription.id}/cancel`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});

    const afterCancel = await prisma.booking.count({ where: { subscriptionId: subscription.id } });
    expect(afterCancel).toBe(beforeCancel);
  });

  it("skipping a single occurrence does not alter the subscription's own schedule", async () => {
    const subscription = await createActiveSubscription();

    const before = await request(app)
      .get(`/api/v1/subscriptions/${subscription.id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    const skipRes = await request(app)
      .post(`/api/v1/subscriptions/${subscription.id}/occurrences/skip`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ occurrenceDate: subscription.startsAt });

    expect(skipRes.status).toBe(201);
    expect(skipRes.body.status).toBe("CANCELLED");

    const after = await request(app)
      .get(`/api/v1/subscriptions/${subscription.id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(after.body.frequency).toBe(before.body.frequency);
    expect(after.body.startsAt).toBe(before.body.startsAt);
    expect(after.body.status).toBe(before.body.status);
  });
});
