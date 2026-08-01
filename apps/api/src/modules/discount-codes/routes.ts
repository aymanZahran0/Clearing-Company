import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRole } from "../../middleware/requireRole.js";
import { tryAuthenticate } from "../../middleware/tryAuthenticate.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requireParam } from "../../lib/params.js";
import {
  createDiscountCodeSchema,
  updateDiscountCodeSchema,
  validateDiscountCodeSchema,
} from "./schema.js";
import * as service from "./service.js";

export const discountCodesRouter = Router();

discountCodesRouter.post(
  "/discount-codes/validate",
  tryAuthenticate,
  validateRequest({ body: validateDiscountCodeSchema }),
  asyncHandler(async (req, res) => {
    res.json(await service.validateDiscountCode(req.body));
  })
);

discountCodesRouter.get(
  "/discount-codes",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (_req, res) => {
    res.json(await service.listDiscountCodes());
  })
);

discountCodesRouter.post(
  "/discount-codes",
  authenticate,
  requireRole("ADMIN"),
  validateRequest({ body: createDiscountCodeSchema }),
  asyncHandler(async (req, res) => {
    res.status(201).json(await service.createDiscountCode(req.body, req.user!.id));
  })
);

discountCodesRouter.patch(
  "/discount-codes/:id",
  authenticate,
  requireRole("ADMIN"),
  validateRequest({ body: updateDiscountCodeSchema }),
  asyncHandler(async (req, res) => {
    res.json(await service.updateDiscountCode(requireParam(req, "id"), req.body));
  })
);

discountCodesRouter.delete(
  "/discount-codes/:id",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    await service.deleteDiscountCode(requireParam(req, "id"));
    res.status(204).send();
  })
);
