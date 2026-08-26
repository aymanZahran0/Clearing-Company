import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRole } from "../../middleware/requireRole.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { availabilityQuerySchema } from "./schema.js";
import * as service from "./service.js";

export const availabilityRouter = Router();

availabilityRouter.get(
  "/availability",
  validateRequest({ query: availabilityQuerySchema }),
  asyncHandler(async (req, res) => {
    res.json(await service.getAvailability(req.query as never));
  })
);

availabilityRouter.get(
  "/time-slots",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (_req, res) => {
    res.json(await service.listTimeSlots());
  })
);
