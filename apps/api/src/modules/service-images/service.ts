import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { ApiError } from "@nuqaa-asir/shared";
import { prisma } from "../../lib/prisma.js";
import { getStorageAdapter } from "../../lib/storage/factory.js";
import { logger } from "../../lib/logging.js";

async function removeStoredImages(images: { url: string }[]) {
  for (const image of images) {
    try {
      const pathname = new URL(image.url, "http://localhost").pathname;
      const index = pathname.indexOf("/services/");
      if (index >= 0) await getStorageAdapter().delete(pathname.slice(index + 1));
    } catch (error) {
      // Catalog changes have committed. A storage outage must not restore old images.
      logger.error({ err: error, imageUrl: image.url }, "Failed to remove unused service image from storage");
    }
  }
}

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

  let replacement;
  try {
    replacement = await prisma.$transaction(async (tx) => {
      // Serialize replacements/deletions for this service, including concurrent uploads.
      await tx.$queryRaw`SELECT id FROM "Service" WHERE id = ${serviceId} FOR UPDATE`;
      const previous = await tx.serviceImage.findMany({ where: { serviceId } });
      await tx.serviceImage.deleteMany({ where: { serviceId } });
      const image = await tx.serviceImage.create({
        data: {
          serviceId,
          url,
          altTextAr: input.altTextAr,
          altTextEn: input.altTextEn,
          sortOrder: 0,
        },
      });
      return { image, previous };
    });
  } catch (error) {
    await removeStoredImages([{ url }]);
    throw error;
  }
  await removeStoredImages(replacement.previous);
  return replacement.image;
}

export async function deleteServiceImage(id: string) {
  const image = await prisma.serviceImage.findUnique({ where: { id } });
  if (!image) {
    throw new ApiError(404, "NOT_FOUND", "Image not found");
  }
  const removed = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Service" WHERE id = ${image.serviceId} FOR UPDATE`;
    // Do not delete a newer replacement if this request references a stale image.
    if (!await tx.serviceImage.findUnique({ where: { id } })) {
      throw new ApiError(404, "NOT_FOUND", "Service image not found");
    }
    const images = await tx.serviceImage.findMany({ where: { serviceId: image.serviceId } });
    await tx.serviceImage.deleteMany({ where: { serviceId: image.serviceId } });
    return images;
  });
  await removeStoredImages(removed);
}
