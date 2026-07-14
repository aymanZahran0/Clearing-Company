import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";
import { createApp } from "../../src/app.js";
import { prisma } from "../../src/lib/prisma.js";

// Requires a live PostgreSQL test database.
describe("Checklist template version snapshotting (User Story 5, FR-046)", () => {
  const app = createApp();
  let adminToken: string;

  beforeEach(async () => {
    await prisma.user.create({
      data: {
        fullName: "Snapshot Admin",
        email: "snapshot-admin@example.com",
        passwordHash: await bcrypt.hash("correct-horse-battery", 4),
        role: "ADMIN",
      },
    });
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ identifier: "snapshot-admin@example.com", password: "correct-horse-battery" });
    adminToken = loginRes.body.accessToken;
  });

  async function createConfirmedBookingForService(serviceId: string) {
    const area = await prisma.serviceArea.create({
      data: { nameAr: "أ", nameEn: "Abha", city: "Abha", travelFee: 0, active: true },
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
      serviceId,
      propertyType: "VILLA",
      propertySizeInput: { conditionModifiers: [] },
      addressId: addressRes.body.id,
      requestedDate: new Date(Date.now() + 86400000).toISOString(),
    });

    const bookingRes = await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .set("Idempotency-Key", `snap-test-${Date.now()}-${Math.random()}`)
      .send({
        quoteId: quoteRes.body.id,
        addressId: addressRes.body.id,
        propertyType: "VILLA",
        preferredDate: new Date(Date.now() + 86400000).toISOString(),
        contactName: "Snapshot Customer",
        contactPhone: "0512340013",
        consentAccepted: true,
      });

    await request(app)
      .post(`/api/v1/bookings/${bookingRes.body.id}/confirm`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});

    return bookingRes.body;
  }

  it("does not alter an in-flight ChecklistRun when the template is edited mid-run", async () => {
    const category = await prisma.serviceCategory.create({
      data: { nameAr: "أ", nameEn: "Cleaning", slug: `snap-cleaning-${Date.now()}` },
    });
    const svc = await prisma.service.create({
      data: {
        categoryId: category.id,
        slug: `snap-service-${Date.now()}`,
        nameAr: "أ",
        nameEn: "Snapshot Service",
        pricingType: "FIXED",
        basePrice: 30000,
      },
    });

    await request(app)
      .put(`/api/v1/services/${svc.id}/checklist-template`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ items: [{ labelAr: "أ", labelEn: "Item A", type: "YES_NO", required: true, sortOrder: 1 }] });

    const booking = await createConfirmedBookingForService(svc.id);

    const firstRun = await request(app)
      .get(`/api/v1/bookings/${booking.id}/checklist`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(firstRun.body.templateVersionSnapshot).toBe(1);
    expect(firstRun.body.template.items.length).toBe(1);

    // Publish a new template version after the run has already started.
    await request(app)
      .put(`/api/v1/services/${svc.id}/checklist-template`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        items: [
          { labelAr: "ب", labelEn: "Item B", type: "YES_NO", required: true, sortOrder: 1 },
          { labelAr: "ج", labelEn: "Item C", type: "YES_NO", required: true, sortOrder: 2 },
        ],
      });

    const secondRead = await request(app)
      .get(`/api/v1/bookings/${booking.id}/checklist`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(secondRead.body.templateVersionSnapshot).toBe(1);
    expect(secondRead.body.template.items.length).toBe(1);
  });
});
