import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRole } from "../../middleware/requireRole.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requireParam } from "../../lib/params.js";
import { createServiceSchema, listServicesQuerySchema, updateServiceSchema } from "./schema.js";
import * as service from "./service.js";

export const servicesRouter = Router();

servicesRouter.get(
  "/services",
  validateRequest({ query: listServicesQuerySchema }),
  asyncHandler(async (req, res) => {
    const { categoryId } = req.query as unknown as { categoryId?: string };
    res.json(await service.listServices(categoryId));
  })
);

servicesRouter.get(
  "/services/:slug",
  asyncHandler(async (req, res) => {
    res.json(await service.getServiceBySlug(requireParam(req, "slug")));
  })
);

servicesRouter.post(
  "/services",
  authenticate,
  requireRole("ADMIN"),
  validateRequest({ body: createServiceSchema }),
  asyncHandler(async (req, res) => {
    res.status(201).json(await service.createService(req.body));
  })
);

servicesRouter.patch(
  "/services/:id",
  authenticate,
  requireRole("ADMIN"),
  validateRequest({ body: updateServiceSchema }),
  asyncHandler(async (req, res) => {
    res.json(await service.updateService(requireParam(req, "id"), req.body));
  })
);

servicesRouter.delete(
  "/services/:id",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    await service.disableService(requireParam(req, "id"));
    res.status(204).send();
  })
);
