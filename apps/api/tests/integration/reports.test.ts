import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";
import { createApp } from "../../src/app.js";
import { prisma } from "../../src/lib/prisma.js";

// Requires a live PostgreSQL test database.
describe("Reports (User Story 8, FR-071/FR-072)", () => {
  const app = createApp();
  let adminToken: string;
  let adminUserId: string;

  beforeEach(async () => {
    const admin = await prisma.user.create({
      data: {
        fullName: "Reports Admin",
        email: "reports-admin@example.com",
        passwordHash: await bcrypt.hash("correct-horse-battery", 4),
        role: "ADMIN",
      },
    });
    adminUserId = admin.id;
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ identifier: "reports-admin@example.com", password: "correct-horse-battery" });
    adminToken = loginRes.body.accessToken;
  });

  it("revenue report totals match seeded completed bookings and payments exactly", async () => {
    const area = await prisma.serviceArea.create({
      data: { nameAr: "أ", nameEn: "Abha", city: "Abha", travelFee: 0, active: true },
    });
    const category = await prisma.serviceCategory.create({
      data: { nameAr: "أ", nameEn: "Cleaning", slug: `report-cleaning-${Date.now()}` },
    });
    const svc = await prisma.service.create({
      data: {
        categoryId: category.id,
        slug: `report-service-${Date.now()}`,
        nameAr: "أ",
        nameEn: "Report Service",
        pricingType: "FIXED",
        basePrice: 30000,
      },
    });
    const user = await prisma.user.create({
      data: {
        fullName: "Report Customer",
        phoneNormalized: `+9665${Math.floor(10000000 + Math.random() * 89999999)}`,
        role: "CUSTOMER",
        customerProfile: { create: {} },
      },
    });
    const address = await prisma.customerAddress.create({
      data: { customerId: user.id, city: "Abha", neighborhood: "Al Numan", serviceAreaId: area.id },
    });

    const completedBooking = await prisma.booking.create({
      data: {
        referenceNumber: `RPT-${Date.now()}`,
        verificationToken: "token",
        customerId: user.id,
        addressId: address.id,
        source: "WEB",
        status: "COMPLETED",
        propertyType: "VILLA",
        propertyDetailsJson: {},
        preferredDate: new Date(),
        completedAt: new Date(),
        subtotalSnapshot: 30000,
        taxSnapshot: 1500,
        discountSnapshot: 0,
        totalSnapshot: 31500,
        items: {
          create: [
            {
              serviceId: svc.id,
              descriptionSnapshot: "Report Service",
              quantity: 1,
              unitPriceSnapshot: 30000,
              totalSnapshot: 30000,
              durationMinutesSnapshot: 60,
            },
          ],
        },
      },
    });
    await prisma.payment.create({
      data: {
        bookingId: completedBooking.id,
        method: "CASH",
        status: "PAID",
        amount: 31500,
        paidAt: new Date(),
        recordedByUserId: adminUserId,
      },
    });

    const revenueRes = await request(app)
      .get("/api/v1/reports/revenue")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(revenueRes.status).toBe(200);
    expect(revenueRes.body.completedBookings).toBe(1);
    expect(revenueRes.body.totalRevenue).toBe(31500);
    expect(revenueRes.body.totalTax).toBe(1500);
    expect(revenueRes.body.totalCollected).toBe(31500);

    const servicesRes = await request(app)
      .get("/api/v1/reports/services")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(servicesRes.body).toHaveLength(1);
    expect(servicesRes.body[0].count).toBe(1);
    expect(servicesRes.body[0].revenue).toBe(30000);
  });
});
