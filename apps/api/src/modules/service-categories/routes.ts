import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRole } from "../../middleware/requireRole.js";
import { tryAuthenticate } from "../../middleware/tryAuthenticate.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requireParam } from "../../lib/params.js";
import { createServiceCategorySchema, listCategoriesQuerySchema, updateServiceCategorySchema } from "./schema.js";
import * as service from "./service.js";

export const serviceCategoriesRouter = Router();

serviceCategoriesRouter.get(
  "/service-categories",
  tryAuthenticate,
  validateRequest({ query: listCategoriesQuerySchema }),
  asyncHandler(async (req, res) => {
    const { includeInactive } = req.query as unknown as { includeInactive?: boolean };
    res.json(await service.listCategories(Boolean(includeInactive) && req.user?.role === "ADMIN"));
  })
);

serviceCategoriesRouter.post(
  "/service-categories",
  authenticate,
  requireRole("ADMIN"),
  validateRequest({ body: createServiceCategorySchema }),
  asyncHandler(async (req, res) => {
    res.status(201).json(await service.createCategory(req.body));
  })
);

serviceCategoriesRouter.patch(
  "/service-categories/:id",
  authenticate,
  requireRole("ADMIN"),
  validateRequest({ body: updateServiceCategorySchema }),
  asyncHandler(async (req, res) => {
    res.json(await service.updateCategory(requireParam(req, "id"), req.body));
  })
);

serviceCategoriesRouter.delete(
  "/service-categories/:id/permanent",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    await service.deleteCategory(requireParam(req, "id"));
    res.status(204).send();
  })
);

serviceCategoriesRouter.delete(
  "/service-categories/:id",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    await service.disableCategory(requireParam(req, "id"));
    res.status(204).send();
  })
);
