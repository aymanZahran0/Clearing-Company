import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRole } from "../../middleware/requireRole.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requireParam } from "../../lib/params.js";
import {
  createSubscriptionSchema,
  listSubscriptionsQuerySchema,
  updateSubscriptionSchema,
} from "./schema.js";
import * as service from "./service.js";

export const subscriptionsRouter = Router();

const skipOccurrenceSchema = z.object({ occurrenceDate: z.coerce.date() });

subscriptionsRouter.post(
  "/subscriptions",
  authenticate,
  requireRole("ADMIN"),
  validateRequest({ body: createSubscriptionSchema }),
  asyncHandler(async (req, res) => {
    res.status(201).json(await service.createSubscription(req.body));
  })
);

subscriptionsRouter.get(
  "/subscriptions",
  authenticate,
  requireRole("ADMIN"),
  validateRequest({ query: listSubscriptionsQuerySchema }),
  asyncHandler(async (req, res) => {
    res.json(await service.listSubscriptions(req.query as never));
  })
);

subscriptionsRouter.get(
  "/subscriptions/me",
  authenticate,
  requireRole("CUSTOMER"),
  asyncHandler(async (req, res) => {
    res.json(await service.listOwnSubscriptions(req.user!.id));
  })
);

subscriptionsRouter.get(
  "/subscriptions/:id",
  authenticate,
  asyncHandler(async (req, res) => {
    const subscription = await service.getSubscription(requireParam(req, "id"));
    if (req.user!.role === "CUSTOMER" && subscription.customerId !== req.user!.id) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Subscription not found" } });
      return;
    }
    res.json(subscription);
  })
);

subscriptionsRouter.patch(
  "/subscriptions/:id",
  authenticate,
  requireRole("ADMIN"),
  validateRequest({ body: updateSubscriptionSchema }),
  asyncHandler(async (req, res) => {
    res.json(await service.updateSubscription(requireParam(req, "id"), req.body));
  })
);

subscriptionsRouter.post(
  "/subscriptions/:id/pause",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    res.json(await service.pauseSubscription(requireParam(req, "id")));
  })
);

subscriptionsRouter.post(
  "/subscriptions/:id/resume",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    res.json(await service.resumeSubscription(requireParam(req, "id")));
  })
);

subscriptionsRouter.post(
  "/subscriptions/:id/cancel",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    res.json(await service.cancelSubscription(requireParam(req, "id")));
  })
);

subscriptionsRouter.get(
  "/subscriptions/:id/occurrences",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    res.json(await service.listOccurrences(requireParam(req, "id")));
  })
);

subscriptionsRouter.post(
  "/subscriptions/:id/occurrences/skip",
  authenticate,
  requireRole("ADMIN"),
  validateRequest({ body: skipOccurrenceSchema }),
  asyncHandler(async (req, res) => {
    const booking = await service.skipOccurrence(requireParam(req, "id"), req.body.occurrenceDate);
    res.status(201).json(booking);
  })
);
