import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { prisma } from "../../src/lib/prisma.js";

// Requires a live PostgreSQL test database.
describe("GET /bookings/reference/:referenceNumber (FR-077)", () => {
  const app = createApp();
  let referenceNumber: string;

  beforeEach(async () => {
    const area = await prisma.serviceArea.create({
      data: { nameAr: "أ", nameEn: "Abha", city: "Abha", travelFee: 0, active: true },
    });
    const category = await prisma.serviceCategory.create({
      data: { nameAr: "أ", nameEn: "Cleaning", slug: "lookup-cleaning" },
    });
    const svc = await prisma.service.create({
      data: {
        categoryId: category.id,
        slug: "lookup-service",
        nameAr: "أ",
        pricingType: "FIXED",
        basePrice: 15000,
      },
    });

    const registerRes = await request(app).post("/api/v1/auth/register").send({
      fullName: "Lookup Tester",
      phone: "0512340002",
      password: "correct-horse-battery",
    });
    const accessToken = registerRes.body.accessToken;

    const addressRes = await request(app)
      .post("/api/v1/addresses/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ city: "Abha", neighborhood: "Al Numan", serviceAreaId: area.id });

    const quoteRes = await request(app).post("/api/v1/quotes/estimate").send({
      serviceId: svc.id,
      propertyType: "APARTMENT",
      propertySizeInput: { conditionModifiers: [] },
      addressId: addressRes.body.id,
      requestedDate: new Date(Date.now() + 86400000).toISOString(),
    });

    const bookingRes = await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${accessToken}`)
      .set("Idempotency-Key", "lookup-key")
      .send({
        quoteId: quoteRes.body.id,
        addressId: addressRes.body.id,
        propertyType: "APARTMENT",
        preferredDate: new Date(Date.now() + 86400000).toISOString(),
        contactName: "Lookup Tester",
        contactPhone: "0512340002",
        consentAccepted: true,
      });

    referenceNumber = bookingRes.body.referenceNumber;
  });

  it("returns a reduced-PII summary using only the reference number", async () => {
    const res = await request(app).get(`/api/v1/bookings/reference/${referenceNumber}`);
    expect(res.status).toBe(200);
    expect(res.body.referenceNumber).toBe(referenceNumber);
    expect(res.body).not.toHaveProperty("customerId");
    expect(res.body).not.toHaveProperty("addressId");
  });

  it("accepts a lowercase reference number", async () => {
    const res = await request(app).get(
      `/api/v1/bookings/reference/${referenceNumber.toLowerCase()}`
    );
    expect(res.status).toBe(200);
    expect(res.body.referenceNumber).toBe(referenceNumber);
  });

  it("rejects lookup for a nonexistent reference", async () => {
    const res = await request(app).get(`/api/v1/bookings/reference/NA-00000000-000000`);
    expect(res.status).toBe(404);
  });
});
