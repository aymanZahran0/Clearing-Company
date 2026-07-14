import { describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/prisma.js";
import { generateSubscriptionOccurrences } from "../../src/jobs/generateSubscriptionOccurrences.js";

// Requires a live PostgreSQL test database.
describe("generateSubscriptionOccurrences (User Story 7, FR-056)", () => {
  it("running the job twice produces no duplicate Booking rows for the same occurrence", async () => {
    const area = await prisma.serviceArea.create({
      data: { nameAr: "أ", nameEn: "Abha", city: "Abha", travelFee: 0, active: true },
    });
    const category = await prisma.serviceCategory.create({
      data: { nameAr: "أ", nameEn: "Cleaning", slug: `sub-cleaning-${Date.now()}` },
    });
    const svc = await prisma.service.create({
      data: {
        categoryId: category.id,
        slug: `sub-service-${Date.now()}`,
        nameAr: "أ",
        nameEn: "Subscription Service",
        pricingType: "FIXED",
        basePrice: 20000,
      },
    });
    const user = await prisma.user.create({
      data: {
        fullName: "Subscription Customer",
        phoneNormalized: `+9665${Math.floor(10000000 + Math.random() * 89999999)}`,
        role: "CUSTOMER",
        customerProfile: { create: {} },
      },
    });
    const address = await prisma.customerAddress.create({
      data: {
        customerId: user.id,
        city: "Abha",
        neighborhood: "Al Numan",
        serviceAreaId: area.id,
      },
    });
    const subscription = await prisma.subscription.create({
      data: {
        customerId: user.id,
        addressId: address.id,
        serviceConfigurationJson: { serviceId: svc.id, addOnIds: [] },
        frequency: "WEEKLY",
        priceSnapshot: 20000,
        startsAt: new Date(),
        status: "ACTIVE",
      },
    });

    const firstRun = await generateSubscriptionOccurrences();
    expect(firstRun.created).toBeGreaterThan(0);

    const afterFirst = await prisma.booking.count({ where: { subscriptionId: subscription.id } });

    // Simulate a lost cursor (e.g. a crashed prior run) by resetting
    // `lastGeneratedAt` — the job must fall back to the existence check +
    // unique-constraint guard rather than re-deriving correctness solely
    // from the cursor.
    await prisma.subscription.update({ where: { id: subscription.id }, data: { lastGeneratedAt: null } });

    const secondRun = await generateSubscriptionOccurrences();
    expect(secondRun.created).toBe(0);

    const afterSecond = await prisma.booking.count({ where: { subscriptionId: subscription.id } });
    expect(afterSecond).toBe(afterFirst);
  });
});
