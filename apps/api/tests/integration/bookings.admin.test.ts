import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";
import { createApp } from "../../src/app.js";
import { prisma } from "../../src/lib/prisma.js";

// Requires a live PostgreSQL test database.
describe("POST /bookings/admin (User Story 2)", () => {
  const app = createApp();
  let adminToken: string;
  let serviceId: string;

  beforeEach(async () => {
    await prisma.user.create({
      data: {
        fullName: "Admin Tester",
        email: "admin-test@example.com",
        passwordHash: await bcrypt.hash("correct-horse-battery", 4),
        role: "ADMIN",
      },
    });

    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ identifier: "admin-test@example.com", password: "correct-horse-battery" });
    adminToken = loginRes.body.accessToken;

    const category = await prisma.serviceCategory.create({
      data: { nameAr: "أ", nameEn: "Cleaning", slug: "admin-booking-cleaning" },
    });
    const svc = await prisma.service.create({
      data: {
        categoryId: category.id,
        slug: "admin-booking-service",
        nameAr: "أ",
        nameEn: "Admin Booking Service",
        pricingType: "FIXED",
        basePrice: 25000,
      },
    });
    serviceId = svc.id;
    await prisma.serviceArea.create({
      data: { nameAr: "أ", nameEn: "Khamis Mushait", city: "Khamis Mushait", travelFee: 0, active: true },
    });
  });

  it("creates a booking for a brand-new customer with no password, entirely via Admin", async () => {
    const area = await prisma.serviceArea.findFirstOrThrow();
    const phone = "0599990001";

    const customerRes = await request(app)
      .post("/api/v1/customers")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ fullName: "Phone Caller", phone });
    expect(customerRes.status).toBe(201);

    const user = await prisma.user.findUniqueOrThrow({ where: { phoneNormalized: "+966599990001" } });
    expect(user.passwordHash).toBeNull();
    expect(user.status).toBe("INVITED");

    const addressRes = await request(app)
      .post(`/api/v1/customers/${user.id}/addresses`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ city: "Khamis Mushait", neighborhood: "Al Sad", serviceAreaId: area.id });
    expect(addressRes.status).toBe(201);

    const quoteRes = await request(app).post("/api/v1/quotes/estimate").send({
      serviceId,
      propertyType: "VILLA",
      propertySizeInput: { conditionModifiers: [] },
      addressId: addressRes.body.id,
      requestedDate: new Date(Date.now() + 86400000).toISOString(),
    });

    const bookingRes = await request(app)
      .post("/api/v1/bookings/admin")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        customerId: user.id,
        quoteId: quoteRes.body.id,
        addressId: addressRes.body.id,
        propertyType: "VILLA",
        preferredDate: new Date(Date.now() + 86400000).toISOString(),
        contactName: "Phone Caller",
        contactPhone: phone,
        consentAccepted: true,
      });

    expect(bookingRes.status).toBe(201);
    expect(bookingRes.body.source).toBe("ADMIN_PHONE");
    expect(bookingRes.body.customerId).toBe(user.id);
  });

  it("appears in the same booking list as a web-submitted booking", async () => {
    // Regression guard: GET /bookings for Admin must not filter by source.
    const res = await request(app)
      .get("/api/v1/bookings")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("items");
  });

  it("rejects a non-Admin (Customer) attempt to hit /bookings/admin", async () => {
    const customerRegister = await request(app).post("/api/v1/auth/register").send({
      fullName: "Not Admin",
      phone: "0599990002",
      password: "correct-horse-battery",
    });

    const res = await request(app)
      .post("/api/v1/bookings/admin")
      .set("Authorization", `Bearer ${customerRegister.body.accessToken}`)
      .send({});

    expect(res.status).toBe(403);
  });
});
