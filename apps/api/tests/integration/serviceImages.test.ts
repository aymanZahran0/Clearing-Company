import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";
import { createApp } from "../../src/app.js";
import { prisma } from "../../src/lib/prisma.js";

// Requires a live PostgreSQL test database (and, for the success-path
// test, real object-storage credentials — see .env.example).
describe("Service image upload (T057, data-model.md §7)", () => {
  const app = createApp();
  let adminToken: string;

  beforeEach(async () => {
    await prisma.user.create({
      data: {
        fullName: "Image Admin",
        email: "image-admin@example.com",
        passwordHash: await bcrypt.hash("correct-horse-battery", 4),
        role: "ADMIN",
      },
    });
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ identifier: "image-admin@example.com", password: "correct-horse-battery" });
    adminToken = loginRes.body.accessToken;
  });

  async function createService() {
    const category = await prisma.serviceCategory.create({
      data: { nameAr: "أ", nameEn: "Cleaning", slug: `img-cleaning-${Date.now()}` },
    });
    return prisma.service.create({
      data: {
        categoryId: category.id,
        slug: `img-service-${Date.now()}`,
        nameAr: "أ",
        nameEn: "Image Service",
        pricingType: "FIXED",
        basePrice: 30000,
      },
    });
  }

  it("rejects a non-image MIME type with 422", async () => {
    const svc = await createService();
    const res = await request(app)
      .post(`/api/v1/services/${svc.id}/images`)
      .set("Authorization", `Bearer ${adminToken}`)
      .attach("image", Buffer.from("not an image"), { filename: "notes.txt", contentType: "text/plain" });

    expect(res.status).toBe(422);
  });

  it("rejects a request with no file attached", async () => {
    const svc = await createService();
    const res = await request(app)
      .post(`/api/v1/services/${svc.id}/images`)
      .set("Authorization", `Bearer ${adminToken}`)
      .field("altTextEn", "A clean room");

    expect(res.status).toBe(422);
  });

  it("rejects upload for a non-Admin caller (403)", async () => {
    const svc = await createService();
    const registerRes = await request(app).post("/api/v1/auth/register").send({
      fullName: "Not Admin",
      phone: `05${Math.floor(10000000 + Math.random() * 89999999)}`,
      password: "correct-horse-battery",
    });

    const res = await request(app)
      .post(`/api/v1/services/${svc.id}/images`)
      .set("Authorization", `Bearer ${registerRes.body.accessToken}`)
      .attach("image", Buffer.from([0xff, 0xd8, 0xff]), { filename: "photo.jpg", contentType: "image/jpeg" });

    expect(res.status).toBe(403);
  });
});
