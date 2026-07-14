import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRole } from "../../middleware/requireRole.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requireParam } from "../../lib/params.js";
import { updateChecklistResultsSchema, upsertChecklistTemplateSchema } from "./schema.js";
import * as service from "./service.js";

export const checklistsRouter = Router();

// T121: versioned per-service checklist template, Admin-gated (catalog
// concern, so it lives under /services/:id/... like the rest of the
// catalog CRUD).
checklistsRouter.get(
  "/services/:id/checklist-template",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    res.json(await service.getChecklistTemplate(requireParam(req, "id")));
  })
);

checklistsRouter.put(
  "/services/:id/checklist-template",
  authenticate,
  requireRole("ADMIN"),
  validateRequest({ body: upsertChecklistTemplateSchema }),
  asyncHandler(async (req, res) => {
    res.json(await service.upsertChecklistTemplate(requireParam(req, "id"), req.body));
  })
);

// T123: the per-booking checklist run, Admin self-review only (no
// separate structured-staff review flow per the two-role model).
checklistsRouter.get(
  "/bookings/:id/checklist",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    res.json(await service.getOrCreateChecklistRun(requireParam(req, "id")));
  })
);

checklistsRouter.patch(
  "/bookings/:id/checklist",
  authenticate,
  requireRole("ADMIN"),
  validateRequest({ body: updateChecklistResultsSchema }),
  asyncHandler(async (req, res) => {
    res.json(await service.updateChecklistResults(requireParam(req, "id"), req.body, req.user!.id));
  })
);

checklistsRouter.post(
  "/bookings/:id/checklist/review",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    res.json(await service.reviewChecklistRun(requireParam(req, "id"), req.user!.id));
  })
);
