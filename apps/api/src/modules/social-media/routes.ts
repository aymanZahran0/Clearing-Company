import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRole } from "../../middleware/requireRole.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { upsertSocialMediaLinkSchema } from "./schema.js";
import * as service from "./service.js";

export const socialMediaRouter = Router();

socialMediaRouter.get(
  "/social-media",
  asyncHandler(async (_req, res) => {
    res.json(await service.listActiveSocialMediaLinks());
  })
);

socialMediaRouter.get(
  "/admin/social-media",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (_req, res) => {
    res.json(await service.listAllSocialMediaLinks());
  })
);

socialMediaRouter.put(
  "/admin/social-media",
  authenticate,
  requireRole("ADMIN"),
  validateRequest({ body: upsertSocialMediaLinkSchema }),
  asyncHandler(async (req, res) => {
    res.json(await service.upsertSocialMediaLink(req.body));
  })
);
