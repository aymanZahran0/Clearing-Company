import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRole } from "../../middleware/requireRole.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { exportQuerySchema, reportRangeQuerySchema } from "./schema.js";
import * as service from "./service.js";

export const reportsRouter = Router();

reportsRouter.get(
  "/reports/operations-summary",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (_req, res) => {
    res.json(await service.getOperationsSummary());
  })
);

reportsRouter.get(
  "/reports/revenue",
  authenticate,
  requireRole("ADMIN"),
  validateRequest({ query: reportRangeQuerySchema }),
  asyncHandler(async (req, res) => {
    const { from, to } = req.query as unknown as { from?: Date; to?: Date };
    res.json(await service.getRevenueReport(from, to));
  })
);

reportsRouter.get(
  "/reports/services",
  authenticate,
  requireRole("ADMIN"),
  validateRequest({ query: reportRangeQuerySchema }),
  asyncHandler(async (req, res) => {
    const { from, to } = req.query as unknown as { from?: Date; to?: Date };
    res.json(await service.getServicesReport(from, to));
  })
);

reportsRouter.get(
  "/reports/quality",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (_req, res) => {
    res.json(await service.getQualityReport());
  })
);

reportsRouter.get(
  "/reports/export.csv",
  authenticate,
  requireRole("ADMIN"),
  validateRequest({ query: exportQuerySchema }),
  asyncHandler(async (req, res) => {
    const { from, to, includePii } = req.query as unknown as {
      from?: Date;
      to?: Date;
      includePii: boolean;
    };
    const csv = await service.exportBookingsCsv(
      { from, to, includePii },
      { actorUserId: req.user!.id, ipAddress: req.ip, userAgent: req.headers["user-agent"] }
    );
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=bookings-export.csv");
    res.send(csv);
  })
);
