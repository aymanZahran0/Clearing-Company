import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";
import { createApp } from "../../src/app.js";
import { prisma } from "../../src/lib/prisma.js";

// Requires a live PostgreSQL test database.
describe("Execution + checklist completion gating (User Story 5, FR-036/FR-048)", () => {
  const app = createApp();
  let adminToken: string;

  beforeEach(async () => {
    await prisma.user.create({
      data: {
        fullName: "Execution Admin",
        email: "execution-admin@example.com",
        passwordHash: await bcrypt.hash("correct-horse-battery", 4),
        role: "ADMIN",
      },
    });
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ identifier: "execution-admin@example.com", password: "correct-horse-battery" });
    adminToken = loginRes.body.accessToken;
  });

  async function createScheduledBooking() {
    const area = await prisma.serviceArea.create({
      data: { nameAr: "أ", nameEn: "Abha", city: "Abha", travelFee: 0, active: true },
    });
    const category = await prisma.serviceCategory.create({
      data: { nameAr: "أ", nameEn: "Cleaning", slug: `exec-cleaning-${Date.now()}` },
    });
    const svc = await prisma.service.create({
      data: {
        categoryId: category.id,
        slug: `exec-service-${Date.now()}`,
        nameAr: "أ",
        nameEn: "Execution Service",
        pricingType: "FIXED",
        basePrice: 30000,
      },
    });
    await prisma.checklistTemplate.create({
      data: {
        serviceId: svc.id,
        version: 1,
        items: {
          create: [
            { labelAr: "أ", labelEn: "Wipe surfaces", type: "YES_NO", required: true, sortOrder: 1 },
            { labelAr: "ب", labelEn: "Vacuum floors", type: "YES_NO", required: true, sortOrder: 2 },
          ],
        },
      },
    });

    const registerRes = await request(app).post("/api/v1/auth/register").send({
      fullName: "Execution Customer",
      phone: `05${Math.floor(10000000 + Math.random() * 89999999)}`,
      password: "correct-horse-battery",
    });
    const customerToken = registerRes.body.accessToken;

    const addressRes = await request(app)
      .post("/api/v1/addresses/me")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ city: "Abha", neighborhood: "Al Numan", serviceAreaId: area.id });

    const quoteRes = await request(app).post("/api/v1/quotes/estimate").send({
      serviceId: svc.id,
      propertyType: "VILLA",
      propertySizeInput: { conditionModifiers: [] },
      addressId: addressRes.body.id,
      requestedDate: new Date(Date.now() + 86400000).toISOString(),
    });

    const bookingRes = await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .set("Idempotency-Key", `exec-test-${Date.now()}-${Math.random()}`)
      .send({
        quoteId: quoteRes.body.id,
        addressId: addressRes.body.id,
        propertyType: "VILLA",
        preferredDate: new Date(Date.now() + 86400000).toISOString(),
        contactName: "Execution Customer",
        contactPhone: "0512340012",
        consentAccepted: true,
      });

    await request(app)
      .post(`/api/v1/bookings/${bookingRes.body.id}/confirm`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});

    return bookingRes.body;
  }

  it("rejects starting execution before arrival is recorded", async () => {
    const booking = await createScheduledBooking();
    const res = await request(app)
      .post(`/api/v1/bookings/${booking.id}/start`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});
    expect(res.status).toBe(409);
  });

  it("blocks completion while required checklist items are outstanding", async () => {
    const booking = await createScheduledBooking();
    await request(app)
      .post(`/api/v1/bookings/${booking.id}/arrive`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});
    await request(app)
      .post(`/api/v1/bookings/${booking.id}/start`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});

    const res = await request(app)
      .post(`/api/v1/bookings/${booking.id}/complete`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(409);
    expect(res.body.error.fieldErrors?.outstanding?.length).toBeGreaterThan(0);
  });

  it("completes once every required checklist item is answered", async () => {
    const booking = await createScheduledBooking();
    await request(app)
      .post(`/api/v1/bookings/${booking.id}/arrive`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});
    await request(app)
      .post(`/api/v1/bookings/${booking.id}/start`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});

    const run = await request(app)
      .get(`/api/v1/bookings/${booking.id}/checklist`)
      .set("Authorization", `Bearer ${adminToken}`);

    await request(app)
      .patch(`/api/v1/bookings/${booking.id}/checklist`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        results: run.body.template.items.map((item: { id: string }) => ({
          templateItemId: item.id,
          value: true,
        })),
      });

    const res = await request(app)
      .post(`/api/v1/bookings/${booking.id}/complete`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("COMPLETED");
  });
});
