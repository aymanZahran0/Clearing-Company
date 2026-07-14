import { z } from "zod";

export const createServiceCategorySchema = z.object({
  nameAr: z.string().trim().min(1).max(200),
  nameEn: z.string().trim().min(1).max(200),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, "slug must be lowercase letters, numbers, and hyphens"),
  sortOrder: z.number().int().default(0),
});
export type CreateServiceCategoryInput = z.infer<typeof createServiceCategorySchema>;

export const updateServiceCategorySchema = createServiceCategorySchema.partial().extend({
  active: z.boolean().optional(),
});
export type UpdateServiceCategoryInput = z.infer<typeof updateServiceCategorySchema>;
