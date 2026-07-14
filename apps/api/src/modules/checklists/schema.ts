import { z } from "zod";

const checklistItemTypeEnum = z.enum(["YES_NO", "TEXT", "NUMBER", "SIGNATURE", "ISSUE_FLAG"]);

export const upsertChecklistTemplateSchema = z.object({
  items: z
    .array(
      z.object({
        labelAr: z.string().trim().min(1).max(300),
        labelEn: z.string().trim().min(1).max(300),
        type: checklistItemTypeEnum,
        required: z.boolean().default(true),
        sortOrder: z.number().int().default(0),
      })
    )
    .min(1),
});
export type UpsertChecklistTemplateInput = z.infer<typeof upsertChecklistTemplateSchema>;

export const updateChecklistResultsSchema = z.object({
  results: z
    .array(
      z.object({
        templateItemId: z.string().uuid(),
        value: z.unknown().optional(),
        isIssue: z.boolean().default(false),
        issueNote: z.string().trim().max(1000).optional(),
      })
    )
    .min(1),
});
export type UpdateChecklistResultsInput = z.infer<typeof updateChecklistResultsSchema>;
