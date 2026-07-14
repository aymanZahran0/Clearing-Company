import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRole } from "../../middleware/requireRole.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { listAuditLogsQuerySchema } from "./schema.js";
import * as service from "./service.js";

export const auditLogsRouter = Router();

auditLogsRouter.get(
  "/audit-logs",
  authenticate,
  requireRole("ADMIN"),
  validateRequest({ query: listAuditLogsQuerySchema }),
  asyncHandler(async (req, res) => {
    res.json(await service.listAuditLogs(req.query as never));
  })
);
