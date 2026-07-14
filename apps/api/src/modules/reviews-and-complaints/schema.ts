import { z } from "zod";

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).optional(),
});
export type CreateReviewInput = z.infer<typeof createReviewSchema>;

export const createComplaintSchema = z.object({
  category: z.string().trim().min(1).max(100),
  severity: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  description: z.string().trim().min(1).max(2000),
});
export type CreateComplaintInput = z.infer<typeof createComplaintSchema>;

export const listQualityIssuesQuerySchema = z.object({
  status: z.enum(["OPEN", "IN_REVIEW", "RESOLVED", "CLOSED"]).optional(),
  source: z.enum(["REVIEW", "COMPLAINT", "CHECKLIST_FAILURE"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListQualityIssuesQuery = z.infer<typeof listQualityIssuesQuerySchema>;

export const updateQualityIssueSchema = z.object({
  category: z.string().trim().min(1).max(100).optional(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  ownerUserId: z.string().uuid().optional(),
  status: z.enum(["OPEN", "IN_REVIEW", "RESOLVED", "CLOSED"]).optional(),
  resolution: z.string().trim().max(2000).optional(),
});
export type UpdateQualityIssueInput = z.infer<typeof updateQualityIssueSchema>;
