import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRole } from "../../middleware/requireRole.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requireParam } from "../../lib/params.js";
import {
  availabilityQuerySchema,
  createClosedDateSchema,
  createTimeSlotSchema,
  operatingHoursSchema,
  updateTimeSlotSchema,
} from "./schema.js";
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
  "/operating-hours",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (_req, res) => {
    res.json(await service.listOperatingHours());
  })
);

availabilityRouter.put(
  "/operating-hours",
  authenticate,
  requireRole("ADMIN"),
  validateRequest({ body: operatingHoursSchema }),
  asyncHandler(async (req, res) => {
    res.json(await service.replaceOperatingHours(req.body));
  })
);

availabilityRouter.get(
  "/closed-dates",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (_req, res) => {
    res.json(await service.listClosedDates());
  })
);

availabilityRouter.post(
  "/closed-dates",
  authenticate,
  requireRole("ADMIN"),
  validateRequest({ body: createClosedDateSchema }),
  asyncHandler(async (req, res) => {
    res.status(201).json(await service.createClosedDate(req.body.date, req.body.reason));
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

availabilityRouter.post(
  "/time-slots",
  authenticate,
  requireRole("ADMIN"),
  validateRequest({ body: createTimeSlotSchema }),
  asyncHandler(async (req, res) => {
    res.status(201).json(await service.createTimeSlot(req.body));
  })
);

availabilityRouter.patch(
  "/time-slots/:id",
  authenticate,
  requireRole("ADMIN"),
  validateRequest({ body: updateTimeSlotSchema }),
  asyncHandler(async (req, res) => {
    res.json(await service.updateTimeSlot(requireParam(req, "id"), req.body));
  })
);
