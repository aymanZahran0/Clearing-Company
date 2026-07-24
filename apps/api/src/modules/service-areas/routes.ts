import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRole } from "../../middleware/requireRole.js";
import { tryAuthenticate } from "../../middleware/tryAuthenticate.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requireParam } from "../../lib/params.js";
import { createServiceAreaSchema, listServiceAreasQuerySchema, updateServiceAreaSchema } from "./schema.js";
import * as service from "./service.js";

export const serviceAreasRouter = Router();

serviceAreasRouter.get(
  "/service-areas",
  tryAuthenticate,
  validateRequest({ query: listServiceAreasQuerySchema }),
  asyncHandler(async (req, res) => {
    const { includeInactive } = req.query as unknown as { includeInactive?: boolean };
    res.json(await service.listAreas(Boolean(includeInactive) && req.user?.role === "ADMIN"));
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

serviceAreasRouter.delete(
  "/service-areas/:id/permanent",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    await service.deleteArea(requireParam(req, "id"));
    res.status(204).send();
  })
);

serviceAreasRouter.delete(
  "/service-areas/:id",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    await service.disableArea(requireParam(req, "id"));
    res.status(204).send();
  })
);
