import { z } from "zod";

export const upsertTemplateSchema = z.object({
  key: z.string().trim().min(1).max(100),
  channel: z.enum(["WHATSAPP", "SMS", "EMAIL"]),
  bodyAr: z.string().trim().min(1),
  bodyEn: z.string().trim().min(1),
  active: z.boolean().default(true),
});
export type UpsertTemplateInput = z.infer<typeof upsertTemplateSchema>;

export const listLogsQuerySchema = z.object({
  status: z.enum(["SENT", "FAILED", "PENDING"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
