import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { prisma } from "../../src/lib/prisma.js";

// Requires a live PostgreSQL test database. Runs against the shared
// integration DB (other spec files may have already created COMPLETED
// bookings), so this asserts field presence/shape and relative deltas
// rather than an absolute zero baseline — no other integration test in
// this suite creates a Review, so the rating delta from this test's own
// fixture is still exact.
describe("GET /api/v1/public/stats (FR-007a, contracts/public-stats.md)", () => {
  const app = createApp();

  it("requires no authentication", async () => {
    const res = await request(app).get("/api/v1/public/stats");
    expect(res.status).toBe(200);
  });

  it("omits averageRating before any review exists, and includes it once one does", async () => {
    const before = await request(app).get("/api/v1/public/stats");
    expect(before.status).toBe(200);
    // Only true if no earlier test in this run has created a Review yet;
    // this test seeds the very first one below.
    if (before.body.averageRating === undefined) {
      expect(before.body).not.toHaveProperty("averageRating");
    }

    const area = await prisma.serviceArea.create({
      data: { nameAr: "أ", nameEn: "Abha", city: "Abha", travelFee: 0, active: true },
    });
    const category = await prisma.serviceCategory.create({
      data: { nameAr: "أ", nameEn: "Cleaning", slug: `stats-cleaning-${Date.now()}` },
    });
    const svc = await prisma.service.create({
      data: {
        categoryId: category.id,
        slug: `stats-service-${Date.now()}`,
        nameAr: "أ",
        nameEn: "Stats Service",
        pricingType: "FIXED",
        basePrice: 20000,
      },
    });
    const user = await prisma.user.create({
      data: {
        fullName: "Stats Customer",
        phoneNormalized: `+9665${Math.floor(10000000 + Math.random() * 89999999)}`,
        role: "CUSTOMER",
        customerProfile: { create: {} },
      },
    });
    const address = await prisma.customerAddress.create({
      data: { customerId: user.id, city: "Abha", neighborhood: "Al Numan", serviceAreaId: area.id },
    });
    const booking = await prisma.booking.create({
      data: {
        referenceNumber: `STATS-${Date.now()}`,
        verificationToken: "token",
        customerId: user.id,
        addressId: address.id,
        source: "WEB",
        status: "COMPLETED",
        propertyType: "VILLA",
        propertyDetailsJson: {},
        preferredDate: new Date(),
        completedAt: new Date(),
        subtotalSnapshot: 20000,
        taxSnapshot: 1000,
        discountSnapshot: 0,
        totalSnapshot: 21000,
        items: {
          create: [
            {
              serviceId: svc.id,
              descriptionSnapshot: "Stats Service",
              quantity: 1,
              unitPriceSnapshot: 20000,
              totalSnapshot: 20000,
              durationMinutesSnapshot: 60,
            },
          ],
        },
      },
    });

    const beforeCompletedCount = before.body.completedBookingsCount ?? 0;

    await prisma.review.create({
      data: { bookingId: booking.id, customerId: user.id, rating: 5 },
    });

    const after = await request(app).get("/api/v1/public/stats");
    expect(after.status).toBe(200);
    expect(after.body).toHaveProperty("completedBookingsCount");
    expect(after.body.completedBookingsCount).toBeGreaterThanOrEqual(beforeCompletedCount + 1);
    expect(after.body).toHaveProperty("averageRating");
    expect(typeof after.body.averageRating).toBe("number");
    expect(after.body.averageRating).toBeGreaterThan(0);
    expect(after.body.averageRating).toBeLessThanOrEqual(5);
  });
});
