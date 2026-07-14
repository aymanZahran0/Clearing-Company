import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";
import { createApp } from "../../src/app.js";
import { prisma } from "../../src/lib/prisma.js";

// Requires a live PostgreSQL test database.
describe("POST /bookings/:id/confirm (User Story 3, FR-034)", () => {
  const app = createApp();
  let adminToken: string;

  beforeEach(async () => {
    await prisma.user.create({
      data: {
        fullName: "Confirm Admin",
        email: "confirm-admin@example.com",
        passwordHash: await bcrypt.hash("correct-horse-battery", 4),
        role: "ADMIN",
      },
    });
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ identifier: "confirm-admin@example.com", password: "correct-horse-battery" });
    adminToken = loginRes.body.accessToken;
  });

  async function createPendingBooking() {
    const area = await prisma.serviceArea.create({
      data: { nameAr: "أ", nameEn: "Abha", city: "Abha", travelFee: 0, active: true },
    });
    const category = await prisma.serviceCategory.create({
      data: { nameAr: "أ", nameEn: "Cleaning", slug: `confirm-cleaning-${Date.now()}` },
    });
    const svc = await prisma.service.create({
      data: {
        categoryId: category.id,
        slug: `confirm-service-${Date.now()}`,
        nameAr: "أ",
        nameEn: "Confirm Service",
        pricingType: "FIXED",
        basePrice: 30000,
      },
    });
    const registerRes = await request(app).post("/api/v1/auth/register").send({
      fullName: "Confirm Customer",
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
      .set("Idempotency-Key", `confirm-test-${Date.now()}`)
      .send({
        quoteId: quoteRes.body.id,
        addressId: addressRes.body.id,
        propertyType: "VILLA",
        preferredDate: new Date(Date.now() + 86400000).toISOString(),
        contactName: "Confirm Customer",
        contactPhone: "0512340009",
        consentAccepted: true,
      });

    return bookingRes.body;
  }

  it("confirms a pending booking with a valid price", async () => {
    const booking = await createPendingBooking();
    const res = await request(app)
      .post(`/api/v1/bookings/${booking.id}/confirm`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("CONFIRMED");
  });

  it("rejects a price override without a reason", async () => {
    const booking = await createPendingBooking();
    const res = await request(app)
      .post(`/api/v1/bookings/${booking.id}/confirm`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ priceOverride: 50000 });
    expect(res.status).toBe(422);
  });

  it("rejects confirming an already-confirmed booking (invalid transition)", async () => {
    const booking = await createPendingBooking();
    await request(app)
      .post(`/api/v1/bookings/${booking.id}/confirm`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});

    const secondAttempt = await request(app)
      .post(`/api/v1/bookings/${booking.id}/confirm`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});
    expect(secondAttempt.status).toBe(409);
    expect(secondAttempt.body.error.code).toBe("BOOKING_TRANSITION_INVALID");
  });

  it("rejects confirm/reject attempts from a non-Admin role", async () => {
    const booking = await createPendingBooking();
    const registerRes = await request(app).post("/api/v1/auth/register").send({
      fullName: "Not Admin",
      phone: "0512340010",
      password: "correct-horse-battery",
    });
    const res = await request(app)
      .post(`/api/v1/bookings/${booking.id}/confirm`)
      .set("Authorization", `Bearer ${registerRes.body.accessToken}`)
      .send({});
    expect(res.status).toBe(403);
  });
});
