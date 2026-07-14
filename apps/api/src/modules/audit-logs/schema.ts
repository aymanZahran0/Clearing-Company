import { z } from "zod";

export const listAuditLogsQuerySchema = z.object({
  entityType: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
