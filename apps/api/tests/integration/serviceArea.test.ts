import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { prisma } from "../../src/lib/prisma.js";

// Requires a live PostgreSQL test database.
describe("service area availability (FR-012)", () => {
  const app = createApp();
  let serviceId: string;
  let disabledAreaId: string;

  beforeEach(async () => {
    const category = await prisma.serviceCategory.create({
      data: { nameAr: "أ", nameEn: "Cleaning", slug: "cleaning-2" },
    });
    const svc = await prisma.service.create({
      data: {
        categoryId: category.id,
        slug: "disabled-area-service",
        nameAr: "أ",
        nameEn: "Test Service",
        pricingType: "FIXED",
        basePrice: 10000,
      },
    });
    serviceId = svc.id;

    const area = await prisma.serviceArea.create({
      data: { nameAr: "أ", nameEn: "Unserviced", city: "Nowhere", travelFee: 0, active: false },
    });
    disabledAreaId = area.id;
  });

  it("rejects a quote request targeting a disabled service area", async () => {
    const res = await request(app).post("/api/v1/quotes/estimate").send({
      serviceId,
      propertyType: "APARTMENT",
      propertySizeInput: { conditionModifiers: [] },
      serviceAreaId: disabledAreaId,
      requestedDate: new Date(Date.now() + 86400000).toISOString(),
    });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("SERVICE_AREA_UNAVAILABLE");
  });

  it("excludes disabled areas from the public service-areas listing", async () => {
    const res = await request(app).get("/api/v1/service-areas");
    const ids = res.body.map((a: { id: string }) => a.id);
    expect(ids).not.toContain(disabledAreaId);
  });
});
