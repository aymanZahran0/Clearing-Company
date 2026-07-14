import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { prisma } from "../../src/lib/prisma.js";

// Requires a live PostgreSQL test database.
describe("GET /bookings/reference/:referenceNumber (FR-077)", () => {
  const app = createApp();
  let referenceNumber: string;
  let verificationToken: string;

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
        nameEn: "Lookup Service",
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
    const dbBooking = await prisma.booking.findUniqueOrThrow({ where: { id: bookingRes.body.id } });
    verificationToken = dbBooking.verificationToken;
  });

  it("returns a reduced-PII summary when the correct token is supplied", async () => {
    const res = await request(app).get(
      `/api/v1/bookings/reference/${referenceNumber}?token=${verificationToken}`
    );
    expect(res.status).toBe(200);
    expect(res.body.referenceNumber).toBe(referenceNumber);
    expect(res.body).not.toHaveProperty("customerId");
    expect(res.body).not.toHaveProperty("addressId");
  });

  it("rejects lookup with a missing token", async () => {
    const res = await request(app).get(`/api/v1/bookings/reference/${referenceNumber}`);
    expect(res.status).toBe(422);
  });

  it("rejects lookup with an incorrect token, without revealing booking details", async () => {
    const res = await request(app).get(
      `/api/v1/bookings/reference/${referenceNumber}?token=wrong-token-value-that-is-long-enough`
    );
    expect(res.status).toBe(403);
    expect(res.body).not.toHaveProperty("status");
  });

  it("rejects lookup for a nonexistent reference", async () => {
    const res = await request(app).get(
      `/api/v1/bookings/reference/NA-00000000-000000?token=${verificationToken}`
    );
    expect(res.status).toBe(404);
  });
});
