import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";
import { createApp } from "../../src/app.js";
import { prisma } from "../../src/lib/prisma.js";

// contracts/reschedule-requests.md (User Story 10): submit/approve (reuses
// rescheduleBooking)/reject/duplicate-pending-blocked/auto-reject-on-cancel.
describe("Reschedule requests (User Story 10)", () => {
  const app = createApp();
  let adminToken: string;
  let customerToken: string;

  beforeEach(async () => {
    await prisma.user.create({
      data: {
        fullName: "Reschedule Admin",
        email: "reschedule-admin@example.com",
        passwordHash: await bcrypt.hash("correct-horse-battery", 4),
        role: "ADMIN",
      },
    });
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ identifier: "reschedule-admin@example.com", password: "correct-horse-battery" });
    adminToken = loginRes.body.accessToken;
  });

  async function createScheduledBooking() {
    const area = await prisma.serviceArea.create({
      data: { nameAr: "أ", nameEn: "Abha", city: "Abha", travelFee: 0, active: true },
    });
    const category = await prisma.serviceCategory.create({
      data: { nameAr: "أ", nameEn: "Cleaning", slug: `resched-cleaning-${Date.now()}` },
    });
    const svc = await prisma.service.create({
      data: {
        categoryId: category.id,
        slug: `resched-service-${Date.now()}`,
        nameAr: "أ",
        nameEn: "Reschedule Service",
        pricingType: "FIXED",
        basePrice: 30000,
      },
    });
    const registerRes = await request(app).post("/api/v1/auth/register").send({
      fullName: "Reschedule Customer",
      phone: `05${Math.floor(10000000 + Math.random() * 89999999)}`,
      password: "correct-horse-battery",
    });
    customerToken = registerRes.body.accessToken;

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
      .set("Idempotency-Key", `resched-test-${Date.now()}-${Math.random()}`)
      .send({
        quoteId: quoteRes.body.id,
        addressId: addressRes.body.id,
        propertyType: "VILLA",
        preferredDate: new Date(Date.now() + 86400000).toISOString(),
        contactName: "Reschedule Customer",
        contactPhone: "0512340022",
        consentAccepted: true,
      });

    await request(app)
      .post(`/api/v1/bookings/${bookingRes.body.id}/confirm`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});

    const originalSlot = await prisma.timeSlot.create({
      data: { date: new Date(Date.now() + 172800000), startTime: "09:00", endTime: "11:00", capacity: 5 },
    });
    await request(app)
      .post(`/api/v1/bookings/${bookingRes.body.id}/schedule`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ timeSlotId: originalSlot.id });

    return bookingRes.body;
  }

  it("submits a reschedule request for a confirmed, scheduled booking", async () => {
    const booking = await createScheduledBooking();
    const newSlot = await prisma.timeSlot.create({
      data: { date: new Date(Date.now() + 259200000), startTime: "13:00", endTime: "15:00", capacity: 5 },
    });

    const res = await request(app)
      .post(`/api/v1/bookings/${booking.id}/reschedule-requests`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        requestedStartAt: new Date(Date.now() + 259200000).toISOString(),
        requestedTimeSlotId: newSlot.id,
        reason: "Schedule conflict",
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("PENDING");
    expect(res.body.bookingId).toBe(booking.id);
  });

  it("blocks a second pending request for the same booking (FR-056)", async () => {
    const booking = await createScheduledBooking();
    const slotA = await prisma.timeSlot.create({
      data: { date: new Date(Date.now() + 259200000), startTime: "13:00", endTime: "15:00", capacity: 5 },
    });
    const slotB = await prisma.timeSlot.create({
      data: { date: new Date(Date.now() + 345600000), startTime: "10:00", endTime: "12:00", capacity: 5 },
    });

    await request(app)
      .post(`/api/v1/bookings/${booking.id}/reschedule-requests`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ requestedStartAt: new Date(Date.now() + 259200000).toISOString(), requestedTimeSlotId: slotA.id });

    const res = await request(app)
      .post(`/api/v1/bookings/${booking.id}/reschedule-requests`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ requestedStartAt: new Date(Date.now() + 345600000).toISOString(), requestedTimeSlotId: slotB.id });

    expect(res.status).toBe(409);
  });

  it("approves a reschedule request, updating the booking's schedule (reuses rescheduleBooking)", async () => {
    const booking = await createScheduledBooking();
    const newSlot = await prisma.timeSlot.create({
      data: { date: new Date(Date.now() + 259200000), startTime: "13:00", endTime: "15:00", capacity: 5 },
    });

    const submitRes = await request(app)
      .post(`/api/v1/bookings/${booking.id}/reschedule-requests`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ requestedStartAt: new Date(Date.now() + 259200000).toISOString(), requestedTimeSlotId: newSlot.id });

    const approveRes = await request(app)
      .post(`/api/v1/admin/reschedule-requests/${submitRes.body.id}/approve`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.status).toBe("APPROVED");

    const updatedBooking = await prisma.booking.findUniqueOrThrow({ where: { id: booking.id } });
    expect(updatedBooking.scheduledTimeSlotId).toBe(newSlot.id);
  });

  it("rejects a reschedule request, leaving the booking's schedule untouched", async () => {
    const booking = await createScheduledBooking();
    const originalTimeSlotId = (await prisma.booking.findUniqueOrThrow({ where: { id: booking.id } }))
      .scheduledTimeSlotId;
    const newSlot = await prisma.timeSlot.create({
      data: { date: new Date(Date.now() + 259200000), startTime: "13:00", endTime: "15:00", capacity: 5 },
    });

    const submitRes = await request(app)
      .post(`/api/v1/bookings/${booking.id}/reschedule-requests`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ requestedStartAt: new Date(Date.now() + 259200000).toISOString(), requestedTimeSlotId: newSlot.id });

    const rejectRes = await request(app)
      .post(`/api/v1/admin/reschedule-requests/${submitRes.body.id}/reject`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ reason: "Slot not actually available" });

    expect(rejectRes.status).toBe(200);
    expect(rejectRes.body.status).toBe("REJECTED");
    expect(rejectRes.body.reason).toBe("Slot not actually available");

    const updatedBooking = await prisma.booking.findUniqueOrThrow({ where: { id: booking.id } });
    expect(updatedBooking.scheduledTimeSlotId).toBe(originalTimeSlotId);
  });

  it("auto-rejects a pending request when its booking is cancelled", async () => {
    const booking = await createScheduledBooking();
    const newSlot = await prisma.timeSlot.create({
      data: { date: new Date(Date.now() + 259200000), startTime: "13:00", endTime: "15:00", capacity: 5 },
    });

    const submitRes = await request(app)
      .post(`/api/v1/bookings/${booking.id}/reschedule-requests`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ requestedStartAt: new Date(Date.now() + 259200000).toISOString(), requestedTimeSlotId: newSlot.id });

    await request(app)
      .post(`/api/v1/bookings/${booking.id}/cancel`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ reason: "Changed my mind" });

    const updated = await prisma.rescheduleRequest.findUniqueOrThrow({ where: { id: submitRes.body.id } });
    expect(updated.status).toBe("AUTO_REJECTED");
    expect(updated.reason).toBe("Booking was cancelled");
  });

  it("lists reschedule requests for Admin, filterable by status", async () => {
    const booking = await createScheduledBooking();
    const newSlot = await prisma.timeSlot.create({
      data: { date: new Date(Date.now() + 259200000), startTime: "13:00", endTime: "15:00", capacity: 5 },
    });
    await request(app)
      .post(`/api/v1/bookings/${booking.id}/reschedule-requests`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ requestedStartAt: new Date(Date.now() + 259200000).toISOString(), requestedTimeSlotId: newSlot.id });

    const res = await request(app)
      .get("/api/v1/admin/reschedule-requests")
      .query({ status: "PENDING" })
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);
    expect(res.body.items[0].booking.referenceNumber).toBe(booking.referenceNumber);
  });
});
