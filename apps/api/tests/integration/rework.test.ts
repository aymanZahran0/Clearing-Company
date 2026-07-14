import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";
import { createApp } from "../../src/app.js";
import { prisma } from "../../src/lib/prisma.js";

// Requires a live PostgreSQL test database.
describe("Rework booking creation (User Story 6, FR-053)", () => {
  const app = createApp();
  let adminToken: string;

  beforeEach(async () => {
    await prisma.user.create({
      data: {
        fullName: "Rework Admin",
        email: "rework-admin@example.com",
        passwordHash: await bcrypt.hash("correct-horse-battery", 4),
        role: "ADMIN",
      },
    });
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ identifier: "rework-admin@example.com", password: "correct-horse-battery" });
    adminToken = loginRes.body.accessToken;
  });

  it("links the rework booking to the original and copies customer/address without re-entry", async () => {
    const area = await prisma.serviceArea.create({
      data: { nameAr: "أ", nameEn: "Abha", city: "Abha", travelFee: 0, active: true },
    });
    const category = await prisma.serviceCategory.create({
      data: { nameAr: "أ", nameEn: "Cleaning", slug: `rework-cleaning-${Date.now()}` },
    });
    const svc = await prisma.service.create({
      data: {
        categoryId: category.id,
        slug: `rework-service-${Date.now()}`,
        nameAr: "أ",
        nameEn: "Rework Service",
        pricingType: "FIXED",
        basePrice: 30000,
      },
    });

    const registerRes = await request(app).post("/api/v1/auth/register").send({
      fullName: "Rework Customer",
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
      .set("Idempotency-Key", `rework-test-${Date.now()}-${Math.random()}`)
      .send({
        quoteId: quoteRes.body.id,
        addressId: addressRes.body.id,
        propertyType: "VILLA",
        preferredDate: new Date(Date.now() + 86400000).toISOString(),
        contactName: "Rework Customer",
        contactPhone: "0512340015",
        consentAccepted: true,
      });

    const complaintRes = await request(app)
      .post(`/api/v1/bookings/${bookingRes.body.id}/complaints`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ category: "quality", description: "Not thorough enough" });

    const reworkRes = await request(app)
      .post(`/api/v1/quality-issues/${complaintRes.body.id}/rework`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});

    expect(reworkRes.status).toBe(201);
    expect(reworkRes.body.originalBookingId).toBe(bookingRes.body.id);
    expect(reworkRes.body.addressId).toBe(addressRes.body.id);
    expect(reworkRes.body.customerId).toBe(bookingRes.body.customerId);

    const issueAfter = await request(app)
      .get(`/api/v1/quality-issues/${complaintRes.body.id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(issueAfter.body.reworkBookingId).toBe(reworkRes.body.id);
  });
});
