import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRole } from "../../middleware/requireRole.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requireParam } from "../../lib/params.js";
import {
  createComplaintSchema,
  createReviewSchema,
  listQualityIssuesQuerySchema,
  updateQualityIssueSchema,
} from "./schema.js";
import * as service from "./service.js";

export const reviewsAndComplaintsRouter = Router();

reviewsAndComplaintsRouter.post(
  "/bookings/:id/review",
  authenticate,
  requireRole("CUSTOMER"),
  validateRequest({ body: createReviewSchema }),
  asyncHandler(async (req, res) => {
    const review = await service.createReview(requireParam(req, "id"), req.user!.id, req.body);
    res.status(201).json(review);
  })
);

reviewsAndComplaintsRouter.post(
  "/bookings/:id/complaints",
  authenticate,
  requireRole("CUSTOMER"),
  validateRequest({ body: createComplaintSchema }),
  asyncHandler(async (req, res) => {
    const issue = await service.createComplaint(requireParam(req, "id"), req.user!.id, req.body);
    res.status(201).json(issue);
  })
);

reviewsAndComplaintsRouter.get(
  "/quality-issues",
  authenticate,
  requireRole("ADMIN"),
  validateRequest({ query: listQualityIssuesQuerySchema }),
  asyncHandler(async (req, res) => {
    res.json(await service.listQualityIssues(req.query as never));
  })
);

reviewsAndComplaintsRouter.get(
  "/quality-issues/alerts",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (_req, res) => {
    res.json(await service.getQualityAlerts());
  })
);

reviewsAndComplaintsRouter.get(
  "/quality-issues/:id",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    res.json(await service.getQualityIssue(requireParam(req, "id")));
  })
);

reviewsAndComplaintsRouter.patch(
  "/quality-issues/:id",
  authenticate,
  requireRole("ADMIN"),
  validateRequest({ body: updateQualityIssueSchema }),
  asyncHandler(async (req, res) => {
    const issue = await service.updateQualityIssue(requireParam(req, "id"), req.body, {
      actorUserId: req.user!.id,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    res.json(issue);
  })
);

reviewsAndComplaintsRouter.post(
  "/quality-issues/:id/rework",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const booking = await service.createReworkBooking(requireParam(req, "id"), {
      actorUserId: req.user!.id,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    res.status(201).json(booking);
  })
);
