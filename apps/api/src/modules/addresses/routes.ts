import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRole } from "../../middleware/requireRole.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requireParam } from "../../lib/params.js";
import { addressInputSchema, addressUpdateSchema } from "./schema.js";
import * as service from "./service.js";

export const addressesRouter = Router();

addressesRouter.get(
  "/addresses/me",
  authenticate,
  requireRole("CUSTOMER"),
  asyncHandler(async (req, res) => {
    res.json(await service.listOwnAddresses(req.user!.id));
  })
);

addressesRouter.post(
  "/addresses/me",
  authenticate,
  requireRole("CUSTOMER"),
  validateRequest({ body: addressInputSchema }),
  asyncHandler(async (req, res) => {
    res.status(201).json(await service.createOwnAddress(req.user!.id, req.body));
  })
);

addressesRouter.patch(
  "/addresses/me/:id",
  authenticate,
  requireRole("CUSTOMER"),
  validateRequest({ body: addressUpdateSchema }),
  asyncHandler(async (req, res) => {
    res.json(await service.updateOwnAddress(req.user!.id, requireParam(req, "id"), req.body));
  })
);

addressesRouter.delete(
  "/addresses/me/:id",
  authenticate,
  requireRole("CUSTOMER"),
  asyncHandler(async (req, res) => {
    await service.deleteOwnAddress(req.user!.id, requireParam(req, "id"));
    res.status(204).send();
  })
);

addressesRouter.get(
  "/customers/:customerId/addresses",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    res.json(await service.listAddressesForCustomer(requireParam(req, "customerId")));
  })
);

addressesRouter.post(
  "/customers/:customerId/addresses",
  authenticate,
  requireRole("ADMIN"),
  validateRequest({ body: addressInputSchema }),
  asyncHandler(async (req, res) => {
    res
      .status(201)
      .json(await service.createAddressForCustomer(requireParam(req, "customerId"), req.body));
  })
);
