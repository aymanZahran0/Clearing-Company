import { z } from "zod";

export const createServiceCategorySchema = z.object({
  nameAr: z.string().trim().min(1).max(200),
  sortOrder: z.number().int().default(0),
});
export type CreateServiceCategoryInput = z.infer<typeof createServiceCategorySchema>;

export const updateServiceCategorySchema = createServiceCategorySchema.partial().extend({
  active: z.boolean().optional(),
});
export type UpdateServiceCategoryInput = z.infer<typeof updateServiceCategorySchema>;

// includeInactive is only honored for an authenticated ADMIN caller (see
// routes.ts) — a CUSTOMER or anonymous request always gets active-only,
// regardless of this flag.
export const listCategoriesQuerySchema = z.object({
  includeInactive: z.coerce.boolean().optional(),
});
export type ListCategoriesQuery = z.infer<typeof listCategoriesQuerySchema>;
