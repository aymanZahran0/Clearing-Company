import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";
import { createApp } from "../../src/app.js";
import { prisma } from "../../src/lib/prisma.js";

// Requires a live PostgreSQL test database.
describe("Price override auditing and snapshot immutability (FR-021, FR-024)", () => {
  const app = createApp();
  let adminToken: string;
  let adminId: string;

  beforeEach(async () => {
    const admin = await prisma.user.create({
      data: {
        fullName: "Snapshot Admin",
        email: "snapshot-admin@example.com",
        passwordHash: await bcrypt.hash("correct-horse-battery", 4),
        role: "ADMIN",
      },
    });
    adminId = admin.id;
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ identifier: "snapshot-admin@example.com", password: "correct-horse-battery" });
    adminToken = loginRes.body.accessToken;
  });

  it("records an AuditLog entry for a price override, and the snapshot survives a later catalog price change", async () => {
    const area = await prisma.serviceArea.create({
      data: { nameAr: "أ", nameEn: "Abha", city: "Abha", travelFee: 0, active: true },
    });
    const category = await prisma.serviceCategory.create({
      data: { nameAr: "أ", nameEn: "Cleaning", slug: `snapshot-cleaning-${Date.now()}` },
    });
    const svc = await prisma.service.create({
      data: {
        categoryId: category.id,
        slug: `snapshot-service-${Date.now()}`,
        nameAr: "أ",
        nameEn: "Snapshot Service",
        pricingType: "FIXED",
        basePrice: 40000,
      },
    });

    const registerRes = await request(app).post("/api/v1/auth/register").send({
      fullName: "Snapshot Customer",
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
      .set("Idempotency-Key", `snapshot-key-${Date.now()}`)
      .send({
        quoteId: quoteRes.body.id,
        addressId: addressRes.body.id,
        propertyType: "VILLA",
        preferredDate: new Date(Date.now() + 86400000).toISOString(),
        contactName: "Snapshot Customer",
        contactPhone: "0512340011",
        consentAccepted: true,
      });

    const confirmRes = await request(app)
      .post(`/api/v1/bookings/${bookingRes.body.id}/confirm`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ priceOverride: 35000, priceOverrideReason: "Loyal customer discount" });

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.totalSnapshot).toBe(35000);

    const auditEntry = await prisma.auditLog.findFirst({
      where: { entityType: "Booking", entityId: bookingRes.body.id, action: "PRICE_OVERRIDE" },
    });
    expect(auditEntry).not.toBeNull();
    expect(auditEntry?.actorUserId).toBe(adminId);

    // Catalog price change after confirmation must not alter the snapshot.
    await prisma.service.update({ where: { id: svc.id }, data: { basePrice: 99999 } });

    const refetched = await request(app)
      .get(`/api/v1/bookings/${bookingRes.body.id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(refetched.body.totalSnapshot).toBe(35000);
  });
});
