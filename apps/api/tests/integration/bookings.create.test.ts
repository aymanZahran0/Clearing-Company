import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { prisma } from "../../src/lib/prisma.js";

// Requires a live PostgreSQL test database — see quickstart.md and
// apps/api/tests/integration/auth.test.ts for the same caveat.
describe("POST /bookings (FR-013 idempotency)", () => {
  const app = createApp();
  let accessToken: string;
  let addressId: string;
  let quoteId: string;

  beforeEach(async () => {
    const area = await prisma.serviceArea.create({
      data: { nameAr: "أ", nameEn: "Abha", city: "Abha", travelFee: 0, active: true },
    });
    const category = await prisma.serviceCategory.create({
      data: { nameAr: "أ", nameEn: "Cleaning", slug: "cleaning" },
    });
    const svc = await prisma.service.create({
      data: {
        categoryId: category.id,
        slug: "villa-cleaning",
        nameAr: "أ",
        nameEn: "Villa Cleaning",
        pricingType: "FIXED",
        basePrice: 20000,
      },
    });

    const registerRes = await request(app).post("/api/v1/auth/register").send({
      fullName: "Booking Tester",
      phone: "0512340001",
      password: "correct-horse-battery",
    });
    accessToken = registerRes.body.accessToken;

    const addressRes = await request(app)
      .post("/api/v1/addresses/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ city: "Abha", neighborhood: "Al Numan", serviceAreaId: area.id });
    addressId = addressRes.body.id;

    const quoteRes = await request(app).post("/api/v1/quotes/estimate").send({
      serviceId: svc.id,
      propertyType: "VILLA",
      propertySizeInput: { conditionModifiers: [] },
      addressId,
      requestedDate: new Date(Date.now() + 86400000).toISOString(),
    });
    quoteId = quoteRes.body.id;
  });

  it("creates exactly one booking when the same Idempotency-Key is submitted twice", async () => {
    const payload = {
      quoteId,
      addressId,
      propertyType: "VILLA",
      preferredDate: new Date(Date.now() + 86400000).toISOString(),
      contactName: "Booking Tester",
      contactPhone: "0512340001",
      consentAccepted: true,
    };

    const first = await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${accessToken}`)
      .set("Idempotency-Key", "test-key-1")
      .send(payload);
    expect(first.status).toBe(201);

    const second = await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${accessToken}`)
      .set("Idempotency-Key", "test-key-1")
      .send(payload);
    expect(second.status).toBe(201);
    expect(second.body.id).toBe(first.body.id);

    const count = await prisma.booking.count({ where: { customerId: first.body.customerId } });
    expect(count).toBe(1);
  });

  it("rejects a booking submission without an Idempotency-Key header", async () => {
    const res = await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        quoteId,
        addressId,
        propertyType: "VILLA",
        preferredDate: new Date().toISOString(),
        contactName: "x",
        contactPhone: "0512340001",
        consentAccepted: true,
      });
    expect(res.status).toBe(422);
  });

  it("locks the price snapshot at creation, unaffected by later catalog price changes", async () => {
    const payload = {
      quoteId,
      addressId,
      propertyType: "VILLA",
      preferredDate: new Date(Date.now() + 86400000).toISOString(),
      contactName: "Booking Tester",
      contactPhone: "0512340001",
      consentAccepted: true,
    };

    const created = await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${accessToken}`)
      .set("Idempotency-Key", "snapshot-test")
      .send(payload);

    const originalTotal = created.body.totalSnapshot;

    const svc = await prisma.service.findFirstOrThrow({ where: { slug: "villa-cleaning" } });
    await prisma.service.update({ where: { id: svc.id }, data: { basePrice: 99999 } });

    const refetched = await request(app)
      .get(`/api/v1/bookings/${created.body.id}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(refetched.body.totalSnapshot).toBe(originalTotal);
  });
});
