import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRole } from "../../middleware/requireRole.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requireParam } from "../../lib/params.js";
import { createPricingRuleSchema, updatePricingRuleSchema } from "./schema.js";
import * as service from "./service.js";

export const pricingRulesRouter = Router();

pricingRulesRouter.get(
  "/pricing-rules",
  authenticate,
  requireRole("ADMIN"),
  validateRequest({ query: z.object({ serviceId: z.string().uuid() }) }),
  asyncHandler(async (req, res) => {
    const { serviceId } = req.query as unknown as { serviceId: string };
    res.json(await service.listRulesForService(serviceId));
  })
);

pricingRulesRouter.post(
  "/pricing-rules",
  authenticate,
  requireRole("ADMIN"),
  validateRequest({ body: createPricingRuleSchema }),
  asyncHandler(async (req, res) => {
    res.status(201).json(await service.createRule(req.body));
  })
);

pricingRulesRouter.patch(
  "/pricing-rules/:id",
  authenticate,
  requireRole("ADMIN"),
  validateRequest({ body: updatePricingRuleSchema }),
  asyncHandler(async (req, res) => {
    res.json(await service.updateRule(requireParam(req, "id"), req.body));
  })
);

pricingRulesRouter.delete(
  "/pricing-rules/:id",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    await service.disableRule(requireParam(req, "id"));
    res.status(204).send();
  })
);
