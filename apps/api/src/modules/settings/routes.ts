import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRole } from "../../middleware/requireRole.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { updateSettingSchema } from "./schema.js";
import * as service from "./service.js";

export const settingsRouter = Router();

settingsRouter.get(
  "/settings",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (_req, res) => {
    res.json(await service.listSettings());
  })
);

settingsRouter.patch(
  "/settings",
  authenticate,
  requireRole("ADMIN"),
  validateRequest({ body: updateSettingSchema }),
  asyncHandler(async (req, res) => {
    res.json(await service.upsertSetting(req.body, req.user!.id));
  })
);
