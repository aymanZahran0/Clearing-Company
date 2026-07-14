import { Router } from "express";
import multer from "multer";
import { ApiError } from "@nuqaa-asir/shared";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRole } from "../../middleware/requireRole.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requireParam } from "../../lib/params.js";
import { uploadServiceImageMetaSchema } from "./schema.js";
import * as service from "./service.js";

// data-model.md §7: max 5MB, image/jpeg|png|webp — enforced again inside
// service.ts (defense in depth), but rejecting oversized bodies here means
// they never reach memory in full.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

export const serviceImagesRouter = Router();

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
