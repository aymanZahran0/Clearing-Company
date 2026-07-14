import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { ApiError } from "@nuqaa-asir/shared";
import { prisma } from "../../lib/prisma.js";
import { getStorageAdapter } from "../../lib/storage/factory.js";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024; // data-model.md §7: max 5MB

// data-model.md §7: server-side re-encode strips EXIF (including GPS
// location data) before storage — re-encoding through sharp without
// `.withMetadata()` drops all metadata by default.
async function reencodeAndStripExif(buffer: Buffer, mimeType: string): Promise<Buffer> {
  const image = sharp(buffer).rotate(); // bake in EXIF orientation before stripping it
  switch (mimeType) {
    case "image/png":
      return image.png().toBuffer();
    case "image/webp":
      return image.webp().toBuffer();
    default:
      return image.jpeg().toBuffer();
  }
}

export async function uploadServiceImage(
  serviceId: string,
  file: { buffer: Buffer; mimetype: string; size: number },
  input: { altTextAr?: string; altTextEn?: string; sortOrder?: number }
) {
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) {
    throw new ApiError(404, "NOT_FOUND", "Service not found");
  }
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    throw new ApiError(422, "VALIDATION_ERROR", "Only JPEG, PNG, and WebP images are allowed");
  }
  if (file.size > MAX_BYTES) {
    throw new ApiError(422, "VALIDATION_ERROR", "Image must be 5MB or smaller");
  }

  const cleaned = await reencodeAndStripExif(file.buffer, file.mimetype);
  const extension = file.mimetype === "image/png" ? "png" : file.mimetype === "image/webp" ? "webp" : "jpg";
  const key = `services/${serviceId}/${randomUUID()}.${extension}`;

  const { url } = await getStorageAdapter().upload({ key, body: cleaned, contentType: file.mimetype });

  return prisma.serviceImage.create({
    data: {
      serviceId,
      url,
      altTextAr: input.altTextAr,
      altTextEn: input.altTextEn,
      sortOrder: input.sortOrder ?? 0,
    },
  });
}

export async function deleteServiceImage(id: string) {
  const image = await prisma.serviceImage.findUnique({ where: { id } });
  if (!image) {
    throw new ApiError(404, "NOT_FOUND", "Image not found");
  }
  const key = image.url.split(`/${process.env.OBJECT_STORAGE_BUCKET}/`)[1];
  if (key) {
    await getStorageAdapter().delete(key);
  }
  await prisma.serviceImage.delete({ where: { id } });
}
