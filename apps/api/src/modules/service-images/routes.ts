import { Router } from "express";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import multer from "multer";
import { ApiError } from "@nuqaa-asir/shared";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRole } from "../../middleware/requireRole.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requireParam } from "../../lib/params.js";
import { uploadServiceImageMetaSchema } from "./schema.js";
import * as service from "./service.js";
import { prisma } from "../../lib/prisma.js";
import { fetchPublicBlobImage, isPublicBlobImageUrl } from "../../lib/storage/publicImage.js";

// data-model.md §7: max 5MB, image/jpeg|png|webp — enforced again inside
// service.ts (defense in depth), but rejecting oversized bodies here means
// they never reach memory in full.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

export const serviceImagesRouter = Router();

// Serve public catalog images through the website's existing /api rewrite.
// Browsers no longer need direct access to the external storage domain.
serviceImagesRouter.get(
  "/service-images/:id/content",
  asyncHandler(async (req, res) => {
    const image = await prisma.serviceImage.findUnique({ where: { id: requireParam(req, "id") } });
    if (!image || !isPublicBlobImageUrl(image.url)) {
      throw new ApiError(404, "NOT_FOUND", "Service image not found");
    }
    const { response, contentType } = await fetchPublicBlobImage(image.url);
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400, immutable");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    // Stream instead of buffering the complete image in a serverless function.
    try {
      await pipeline(Readable.fromWeb(response.body!), res);
    } catch (error) {
      // A failed stream has already closed the response; do not send JSON
      // errors after image headers or bytes have been written.
      req.log?.error({ err: error, imageId: image.id }, "Service image stream failed");
      res.destroy();
    }
  })
);

serviceImagesRouter.post(
  "/services/:id/images",
  authenticate,
  requireRole("ADMIN"),
  upload.single("image"),
  validateRequest({ body: uploadServiceImageMetaSchema }),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new ApiError(422, "VALIDATION_ERROR", "An image file is required (field name: image)");
    }
    const image = await service.uploadServiceImage(
      requireParam(req, "id"),
      { buffer: req.file.buffer, mimetype: req.file.mimetype, size: req.file.size },
      req.body
    );
    res.status(201).json(image);
  })
);

serviceImagesRouter.delete(
  "/service-images/:id",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    await service.deleteServiceImage(requireParam(req, "id"));
    res.status(204).send();
  })
);
