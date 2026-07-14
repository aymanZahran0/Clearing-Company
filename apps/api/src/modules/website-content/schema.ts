import { z } from "zod";

export const upsertContentBlockSchema = z.object({
  key: z.string().trim().min(1).max(100),
  type: z.enum(["PAGE", "SECTION"]),
  titleAr: z.string().trim().min(1),
  titleEn: z.string().trim().min(1),
  bodyAr: z.string().trim().min(1),
  bodyEn: z.string().trim().min(1),
  sortOrder: z.number().int().default(0),
  active: z.boolean().default(true),
});
export type UpsertContentBlockInput = z.infer<typeof upsertContentBlockSchema>;

export const upsertFaqItemSchema = z.object({
  questionAr: z.string().trim().min(1),
  questionEn: z.string().trim().min(1),
  answerAr: z.string().trim().min(1),
  answerEn: z.string().trim().min(1),
  sortOrder: z.number().int().default(0),
  active: z.boolean().default(true),
});
export type UpsertFaqItemInput = z.infer<typeof upsertFaqItemSchema>;
