import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRole } from "../../middleware/requireRole.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { listJobRunsQuerySchema } from "./schema.js";
import * as service from "./service.js";

export const jobRunsRouter = Router();

jobRunsRouter.get(
  "/admin/job-runs",
  authenticate,
  requireRole("ADMIN"),
  validateRequest({ query: listJobRunsQuerySchema }),
  asyncHandler(async (req, res) => {
    res.json(await service.listJobRuns(req.query as unknown as Parameters<typeof service.listJobRuns>[0]));
  })
);
