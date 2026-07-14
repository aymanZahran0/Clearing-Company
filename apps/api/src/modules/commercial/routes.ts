import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRole } from "../../middleware/requireRole.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requireParam } from "../../lib/params.js";
import {
  createCommercialAccountSchema,
  createCommercialLocationSchema,
  createContractSchema,
  updateCommercialAccountSchema,
  updateContractSchema,
} from "./schema.js";
import * as service from "./service.js";

export const commercialRouter = Router();

commercialRouter.post(
  "/commercial-accounts",
  authenticate,
  requireRole("ADMIN"),
  validateRequest({ body: createCommercialAccountSchema }),
  asyncHandler(async (req, res) => {
    res.status(201).json(await service.createCommercialAccount(req.body));
  })
);

commercialRouter.get(
  "/commercial-accounts",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (_req, res) => {
    res.json(await service.listCommercialAccounts());
  })
);

commercialRouter.get(
  "/commercial-accounts/:id",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    res.json(await service.getCommercialAccount(requireParam(req, "id")));
  })
);

commercialRouter.patch(
  "/commercial-accounts/:id",
  authenticate,
  requireRole("ADMIN"),
  validateRequest({ body: updateCommercialAccountSchema }),
  asyncHandler(async (req, res) => {
    res.json(await service.updateCommercialAccount(requireParam(req, "id"), req.body));
  })
);

commercialRouter.post(
  "/commercial-accounts/:id/locations",
  authenticate,
  requireRole("ADMIN"),
  validateRequest({ body: createCommercialLocationSchema }),
  asyncHandler(async (req, res) => {
    res.status(201).json(await service.addCommercialLocation(requireParam(req, "id"), req.body));
  })
);

commercialRouter.post(
  "/commercial-accounts/:id/contracts",
  authenticate,
  requireRole("ADMIN"),
  validateRequest({ body: createContractSchema }),
  asyncHandler(async (req, res) => {
    res.status(201).json(await service.createContract(requireParam(req, "id"), req.body));
  })
);

commercialRouter.patch(
  "/contracts/:id",
  authenticate,
  requireRole("ADMIN"),
  validateRequest({ body: updateContractSchema }),
  asyncHandler(async (req, res) => {
    res.json(await service.updateContract(requireParam(req, "id"), req.body));
  })
);
