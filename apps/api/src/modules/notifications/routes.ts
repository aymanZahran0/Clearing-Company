import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRole } from "../../middleware/requireRole.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { listLogsQuerySchema, upsertTemplateSchema } from "./schema.js";
import * as service from "./service.js";

export const notificationsRouter = Router();

notificationsRouter.get(
  "/notification-templates",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (_req, res) => {
    res.json(await service.listTemplates());
  })
);

notificationsRouter.put(
  "/notification-templates",
  authenticate,
  requireRole("ADMIN"),
  validateRequest({ body: upsertTemplateSchema }),
  asyncHandler(async (req, res) => {
    res.json(await service.upsertTemplate(req.body));
  })
);

notificationsRouter.get(
  "/notification-logs",
  authenticate,
  requireRole("ADMIN"),
  validateRequest({ query: listLogsQuerySchema }),
  asyncHandler(async (req, res) => {
    res.json(await service.listLogs(req.query as never));
  })
);

notificationsRouter.get(
  "/notification-logs/me",
  authenticate,
  requireRole("CUSTOMER"),
  asyncHandler(async (req, res) => {
    res.json(await service.listLogsForCustomer(req.user!.id));
  })
);
