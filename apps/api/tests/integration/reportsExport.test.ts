import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";
import ExcelJS from "exceljs";
import { createApp } from "../../src/app.js";
import { prisma } from "../../src/lib/prisma.js";

// Requires a live PostgreSQL test database.
describe("Excel export PII exclusion (User Story 8, FR-073/FR-074)", () => {
  const app = createApp();
  let adminToken: string;

  beforeEach(async () => {
    await prisma.user.create({
      data: {
        fullName: "Export Admin",
        email: "export-admin@example.com",
        passwordHash: await bcrypt.hash("correct-horse-battery", 4),
        role: "ADMIN",
      },
    });
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ identifier: "export-admin@example.com", password: "correct-horse-battery" });
    adminToken = loginRes.body.accessToken;
  });

  async function seedBooking() {
    const area = await prisma.serviceArea.create({
      data: { nameAr: "أ", nameEn: "Abha", city: "Abha", travelFee: 0, active: true },
    });
    const category = await prisma.serviceCategory.create({
      data: { nameAr: "أ", nameEn: "Cleaning", slug: `export-cleaning-${Date.now()}` },
    });
    const svc = await prisma.service.create({
      data: {
        categoryId: category.id,
        slug: `export-service-${Date.now()}`,
        nameAr: "أ",
        pricingType: "FIXED",
        basePrice: 30000,
      },
    });
    const phone = `+9665${Math.floor(10000000 + Math.random() * 89999999)}`;
    const user = await prisma.user.create({
      data: {
        fullName: "Export Customer",
        phoneNormalized: phone,
        role: "CUSTOMER",
        customerProfile: { create: {} },
      },
    });
    const address = await prisma.customerAddress.create({
      data: {
        customerId: user.id,
        city: "Abha",
        neighborhood: "Al Numan-Distinctive-Street-Marker",
        serviceAreaId: area.id,
      },
    });
    await prisma.booking.create({
      data: {
        referenceNumber: `EXP-${Date.now()}`,
        verificationToken: "token",
        customerId: user.id,
        addressId: address.id,
        source: "WEB",
        status: "PENDING",
        propertyType: "VILLA",
        propertyDetailsJson: {},
        preferredDate: new Date(),
        items: {
          create: [
            {
              serviceId: svc.id,
              descriptionSnapshot: "Export Service",
              quantity: 1,
              unitPriceSnapshot: 30000,
              totalSnapshot: 30000,
              durationMinutesSnapshot: 60,
            },
          ],
        },
      },
    });
    return phone;
  }

  async function readSheetValues(buffer: Buffer) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const sheet = workbook.worksheets[0];
    const rows: unknown[][] = [];
    sheet.eachRow((row) => rows.push(row.values as unknown[]));
    return rows;
  }

  it("omits phone and address fields by default", async () => {
    const phone = await seedBooking();

    const res = await request(app)
      .get("/api/v1/reports/export.xlsx")
      .set("Authorization", `Bearer ${adminToken}`)
      .buffer(true)
      .parse((response, callback) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer) => chunks.push(chunk));
        response.on("end", () => callback(null, Buffer.concat(chunks)));
      });

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    const rows = await readSheetValues(res.body as Buffer);
    const header = rows[0];
    expect(header).not.toContain("Phone");
    expect(JSON.stringify(rows)).not.toContain(phone);
    expect(JSON.stringify(rows)).not.toContain("Al Numan-Distinctive-Street-Marker");
  });

  it("includes phone and address only when includePii=true", async () => {
    const phone = await seedBooking();

    const res = await request(app)
      .get("/api/v1/reports/export.xlsx?includePii=true")
      .set("Authorization", `Bearer ${adminToken}`)
      .buffer(true)
      .parse((response, callback) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer) => chunks.push(chunk));
        response.on("end", () => callback(null, Buffer.concat(chunks)));
      });

    expect(res.status).toBe(200);

    const rows = await readSheetValues(res.body as Buffer);
    expect(rows[0]).toContain("Phone");
    expect(JSON.stringify(rows)).toContain(phone);
  });
});
