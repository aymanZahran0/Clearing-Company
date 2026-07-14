import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRole } from "../../middleware/requireRole.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requireParam } from "../../lib/params.js";
import { createServiceAreaSchema, updateServiceAreaSchema } from "./schema.js";
import * as service from "./service.js";

export const serviceAreasRouter = Router();

serviceAreasRouter.get(
  "/service-areas",
  asyncHandler(async (_req, res) => {
    res.json(await service.listActiveAreas());
  })
);

serviceAreasRouter.post(
  "/service-areas",
  authenticate,
  requireRole("ADMIN"),
  validateRequest({ body: createServiceAreaSchema }),
  asyncHandler(async (req, res) => {
    res.status(201).json(await service.createArea(req.body));
  })
);

serviceAreasRouter.patch(
  "/service-areas/:id",
  authenticate,
  requireRole("ADMIN"),
  validateRequest({ body: updateServiceAreaSchema }),
  asyncHandler(async (req, res) => {
    res.json(await service.updateArea(requireParam(req, "id"), req.body));
  })
);
