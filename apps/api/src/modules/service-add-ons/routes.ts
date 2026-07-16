import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRole } from "../../middleware/requireRole.js";
import { tryAuthenticate } from "../../middleware/tryAuthenticate.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requireParam } from "../../lib/params.js";
import { createServiceAddOnSchema, listAddOnsQuerySchema, updateServiceAddOnSchema } from "./schema.js";
import * as service from "./service.js";

export const serviceAddOnsRouter = Router();

serviceAddOnsRouter.get(
  "/service-add-ons",
  tryAuthenticate,
  validateRequest({ query: listAddOnsQuerySchema }),
  asyncHandler(async (req, res) => {
    const { serviceId, includeInactive } = req.query as unknown as {
      serviceId?: string;
      includeInactive?: boolean;
    };
    res.json(await service.listAddOns(serviceId, Boolean(includeInactive) && req.user?.role === "ADMIN"));
  })
);

serviceAddOnsRouter.post(
  "/service-add-ons",
  authenticate,
  requireRole("ADMIN"),
  validateRequest({ body: createServiceAddOnSchema }),
  asyncHandler(async (req, res) => {
    res.status(201).json(await service.createAddOn(req.body));
  })
);

serviceAddOnsRouter.patch(
  "/service-add-ons/:id",
  authenticate,
  requireRole("ADMIN"),
  validateRequest({ body: updateServiceAddOnSchema }),
  asyncHandler(async (req, res) => {
    res.json(await service.updateAddOn(requireParam(req, "id"), req.body));
  })
);

serviceAddOnsRouter.delete(
  "/service-add-ons/:id",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    await service.disableAddOn(requireParam(req, "id"));
    res.status(204).send();
  })
);
