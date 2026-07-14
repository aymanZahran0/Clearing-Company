import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRole } from "../../middleware/requireRole.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requireParam } from "../../lib/params.js";
import { upsertContentBlockSchema, upsertFaqItemSchema } from "./schema.js";
import * as service from "./service.js";

export const websiteContentRouter = Router();

websiteContentRouter.get(
  "/content-blocks",
  asyncHandler(async (_req, res) => {
    res.json(await service.listActiveContentBlocks());
  })
);

websiteContentRouter.get(
  "/admin/content-blocks",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (_req, res) => {
    res.json(await service.listAllContentBlocks());
  })
);

websiteContentRouter.put(
  "/admin/content-blocks",
  authenticate,
  requireRole("ADMIN"),
  validateRequest({ body: upsertContentBlockSchema }),
  asyncHandler(async (req, res) => {
    res.json(await service.upsertContentBlock(req.body));
  })
);

websiteContentRouter.delete(
  "/admin/content-blocks/:id",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    await service.deleteContentBlock(requireParam(req, "id"));
    res.status(204).send();
  })
);

websiteContentRouter.get(
  "/faqs",
  asyncHandler(async (_req, res) => {
    res.json(await service.listActiveFaqs());
  })
);

websiteContentRouter.get(
  "/admin/faqs",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (_req, res) => {
    res.json(await service.listAllFaqs());
  })
);

websiteContentRouter.post(
  "/admin/faqs",
  authenticate,
  requireRole("ADMIN"),
  validateRequest({ body: upsertFaqItemSchema }),
  asyncHandler(async (req, res) => {
    res.status(201).json(await service.createFaqItem(req.body));
  })
);

websiteContentRouter.patch(
  "/admin/faqs/:id",
  authenticate,
  requireRole("ADMIN"),
  validateRequest({ body: upsertFaqItemSchema.partial() }),
  asyncHandler(async (req, res) => {
    res.json(await service.updateFaqItem(requireParam(req, "id"), req.body));
  })
);

websiteContentRouter.delete(
  "/admin/faqs/:id",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    await service.deleteFaqItem(requireParam(req, "id"));
    res.status(204).send();
  })
);
