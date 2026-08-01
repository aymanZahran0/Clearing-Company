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
    res.status(201).json(await service.createReview(requireParam(req, "id"), req.user!.id, req.body));
  })
);

reviewsAndComplaintsRouter.post(
  "/bookings/:id/complaints",
  authenticate,
  requireRole("CUSTOMER"),
  validateRequest({ body: createComplaintSchema }),
  asyncHandler(async (req, res) => {
    res.status(201).json(await service.createComplaint(requireParam(req, "id"), req.user!.id, req.body));
  })
);

reviewsAndComplaintsRouter.get(
  "/quality-issues",
  authenticate,
  requireRole("ADMIN"),
  validateRequest({ query: listQualityIssuesQuerySchema }),
  asyncHandler(async (req, res) => res.json(await service.listQualityIssues(req.query as never)))
);

reviewsAndComplaintsRouter.get(
  "/quality-issues/:id",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => res.json(await service.getQualityIssue(requireParam(req, "id"))))
);

reviewsAndComplaintsRouter.patch(
  "/quality-issues/:id",
  authenticate,
  requireRole("ADMIN"),
  validateRequest({ body: updateQualityIssueSchema }),
  asyncHandler(async (req, res) => {
    res.json(await service.updateQualityIssue(requireParam(req, "id"), req.body, req.user!.id));
  })
);
