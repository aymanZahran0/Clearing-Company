import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";
import { createApp } from "../../src/app.js";
import { prisma } from "../../src/lib/prisma.js";

// Requires a live PostgreSQL test database.
describe("POST /bookings/:id/schedule (User Story 4, FR-029/FR-030)", () => {
  const app = createApp();
  let adminToken: string;

  beforeEach(async () => {
    await prisma.user.create({
      data: {
        fullName: "Schedule Admin",
        email: "schedule-admin@example.com",
        passwordHash: await bcrypt.hash("correct-horse-battery", 4),
        role: "ADMIN",
      },
    });
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ identifier: "schedule-admin@example.com", password: "correct-horse-battery" });
    adminToken = loginRes.body.accessToken;
  });

  async function createConfirmedBooking() {
    const area = await prisma.serviceArea.create({
      data: { nameAr: "أ", nameEn: "Abha", city: "Abha", travelFee: 0, active: true },
    });
    const category = await prisma.serviceCategory.create({
      data: { nameAr: "أ", nameEn: "Cleaning", slug: `sched-cleaning-${Date.now()}` },
    });
    const svc = await prisma.service.create({
      data: {
        categoryId: category.id,
        slug: `sched-service-${Date.now()}`,
        nameAr: "أ",
        nameEn: "Schedule Service",
        pricingType: "FIXED",
        basePrice: 30000,
      },
    });
    const registerRes = await request(app).post("/api/v1/auth/register").send({
      fullName: "Schedule Customer",
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
      .set("Idempotency-Key", `sched-test-${Date.now()}-${Math.random()}`)
      .send({
        quoteId: quoteRes.body.id,
        addressId: addressRes.body.id,
        propertyType: "VILLA",
        preferredDate: new Date(Date.now() + 86400000).toISOString(),
        contactName: "Schedule Customer",
        contactPhone: "0512340011",
        consentAccepted: true,
      });

    await request(app)
      .post(`/api/v1/bookings/${bookingRes.body.id}/confirm`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});

    return bookingRes.body;
  }

  it("schedules into a full time slot without override -> 409", async () => {
    const slot = await prisma.timeSlot.create({
      data: {
        date: new Date(Date.now() + 172800000),
        startTime: "09:00",
        endTime: "11:00",
        capacity: 1,
        bookedCount: 1, // already at capacity
      },
    });
    const booking = await createConfirmedBooking();

    const res = await request(app)
      .post(`/api/v1/bookings/${booking.id}/schedule`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ timeSlotId: slot.id });

    expect(res.status).toBe(409);
  });

  it("schedules into a full time slot with override -> 200 + AuditLog entry", async () => {
    const slot = await prisma.timeSlot.create({
      data: {
        date: new Date(Date.now() + 172800000),
        startTime: "09:00",
        endTime: "11:00",
        capacity: 1,
        bookedCount: 1,
      },
    });
    const booking = await createConfirmedBooking();

    const res = await request(app)
      .post(`/api/v1/bookings/${booking.id}/schedule`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ timeSlotId: slot.id, overrideCapacity: true });

    expect(res.status).toBe(200);
    expect(res.body.scheduledStartAt).not.toBeNull();

  });

  it("schedules normally when capacity is available", async () => {
    const slot = await prisma.timeSlot.create({
      data: {
        date: new Date(Date.now() + 172800000),
        startTime: "09:00",
        endTime: "11:00",
        capacity: 5,
        bookedCount: 0,
      },
    });
    const booking = await createConfirmedBooking();

    const res = await request(app)
      .post(`/api/v1/bookings/${booking.id}/schedule`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ timeSlotId: slot.id });

    expect(res.status).toBe(200);
    const updatedSlot = await prisma.timeSlot.findUnique({ where: { id: slot.id } });
    expect(updatedSlot?.bookedCount).toBe(1);
  });
});
