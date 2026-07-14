import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";
import { createApp } from "../../src/app.js";
import { prisma } from "../../src/lib/prisma.js";

// Requires a live PostgreSQL test database.
describe("Reviews and complaints (User Story 6, FR-050/FR-052)", () => {
  const app = createApp();
  let adminToken: string;

  beforeEach(async () => {
    await prisma.user.create({
      data: {
        fullName: "Quality Admin",
        email: "quality-admin@example.com",
        passwordHash: await bcrypt.hash("correct-horse-battery", 4),
        role: "ADMIN",
      },
    });
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ identifier: "quality-admin@example.com", password: "correct-horse-battery" });
    adminToken = loginRes.body.accessToken;
  });

  async function createCompletedBooking() {
    const area = await prisma.serviceArea.create({
      data: { nameAr: "أ", nameEn: "Abha", city: "Abha", travelFee: 0, active: true },
    });
    const category = await prisma.serviceCategory.create({
      data: { nameAr: "أ", nameEn: "Cleaning", slug: `review-cleaning-${Date.now()}` },
    });
    const svc = await prisma.service.create({
      data: {
        categoryId: category.id,
        slug: `review-service-${Date.now()}`,
        nameAr: "أ",
        nameEn: "Review Service",
        pricingType: "FIXED",
        basePrice: 30000,
      },
    });
    await prisma.checklistTemplate.create({
      data: {
        serviceId: svc.id,
        version: 1,
        items: { create: [{ labelAr: "أ", labelEn: "Item", type: "YES_NO", required: true, sortOrder: 1 }] },
      },
    });

    const registerRes = await request(app).post("/api/v1/auth/register").send({
      fullName: "Review Customer",
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
      .set("Idempotency-Key", `review-test-${Date.now()}-${Math.random()}`)
      .send({
        quoteId: quoteRes.body.id,
        addressId: addressRes.body.id,
        propertyType: "VILLA",
        preferredDate: new Date(Date.now() + 86400000).toISOString(),
        contactName: "Review Customer",
        contactPhone: "0512340014",
        consentAccepted: true,
      });

    await request(app)
      .post(`/api/v1/bookings/${bookingRes.body.id}/confirm`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});
    await request(app)
      .post(`/api/v1/bookings/${bookingRes.body.id}/arrive`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});
    await request(app)
      .post(`/api/v1/bookings/${bookingRes.body.id}/start`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});

    const run = await request(app)
      .get(`/api/v1/bookings/${bookingRes.body.id}/checklist`)
      .set("Authorization", `Bearer ${adminToken}`);
    await request(app)
      .patch(`/api/v1/bookings/${bookingRes.body.id}/checklist`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ results: run.body.template.items.map((item: { id: string }) => ({ templateItemId: item.id, value: true })) });
    await request(app)
      .post(`/api/v1/bookings/${bookingRes.body.id}/complete`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});

    return { booking: bookingRes.body, customerToken };
  }

  it("rejects a second review on the same booking", async () => {
    const { booking, customerToken } = await createCompletedBooking();

    await request(app)
      .post(`/api/v1/bookings/${booking.id}/review`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ rating: 5, comment: "Great!" });

    const second = await request(app)
      .post(`/api/v1/bookings/${booking.id}/review`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ rating: 4 });

    expect(second.status).toBe(409);
  });

  it("auto-opens a quality issue and COMPLAINT_OPENED status on a low rating", async () => {
    const { booking, customerToken } = await createCompletedBooking();

    const res = await request(app)
      .post(`/api/v1/bookings/${booking.id}/review`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ rating: 1, comment: "Not happy" });

    expect(res.status).toBe(201);
    expect(res.body.followUpRequired).toBe(true);

    const updatedBooking = await request(app)
      .get(`/api/v1/bookings/${booking.id}`)
      .set("Authorization", `Bearer ${customerToken}`);
    expect(updatedBooking.body.status).toBe("COMPLAINT_OPENED");
  });

  it("rejects closing a quality issue without a resolution", async () => {
    const { booking, customerToken } = await createCompletedBooking();

    const complaintRes = await request(app)
      .post(`/api/v1/bookings/${booking.id}/complaints`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ category: "quality", description: "Missed a spot" });

    const closeRes = await request(app)
      .patch(`/api/v1/quality-issues/${complaintRes.body.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "CLOSED" });

    expect(closeRes.status).toBe(422);
  });
});
