import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRole } from "../../middleware/requireRole.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requireParam } from "../../lib/params.js";
import {
  approveRescheduleRequestSchema,
  listRescheduleRequestsQuerySchema,
  rejectRescheduleRequestSchema,
  submitRescheduleRequestSchema,
} from "./schema.js";
import * as service from "./service.js";

export const rescheduleRequestsRouter = Router();

rescheduleRequestsRouter.post(
  "/bookings/:id/reschedule-requests",
  authenticate,
  validateRequest({ body: submitRescheduleRequestSchema }),
  asyncHandler(async (req, res) => {
    const created = await service.submitRescheduleRequest(
      requireParam(req, "id"),
      req.body,
      req.user!,
      { actorUserId: req.user!.id, ipAddress: req.ip, userAgent: req.headers["user-agent"] }
    );
    res.status(201).json(created);
  })
);

rescheduleRequestsRouter.get(
  "/admin/reschedule-requests",
  authenticate,
  requireRole("ADMIN"),
  validateRequest({ query: listRescheduleRequestsQuerySchema }),
  asyncHandler(async (req, res) => {
    res.json(
      await service.listRescheduleRequests(
        req.query as unknown as Parameters<typeof service.listRescheduleRequests>[0]
      )
    );
  })
);

rescheduleRequestsRouter.post(
  "/admin/reschedule-requests/:id/approve",
  authenticate,
  requireRole("ADMIN"),
  validateRequest({ body: approveRescheduleRequestSchema }),
  asyncHandler(async (req, res) => {
    const updated = await service.approveRescheduleRequest(requireParam(req, "id"), req.body, {
      actorUserId: req.user!.id,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    res.json(updated);
  })
);

rescheduleRequestsRouter.post(
  "/admin/reschedule-requests/:id/reject",
  authenticate,
  requireRole("ADMIN"),
  validateRequest({ body: rejectRescheduleRequestSchema }),
  asyncHandler(async (req, res) => {
    const updated = await service.rejectRescheduleRequest(requireParam(req, "id"), req.body, {
      actorUserId: req.user!.id,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    res.json(updated);
  })
);
