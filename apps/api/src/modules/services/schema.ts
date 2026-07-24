import { z } from "zod";
import { moneySchema } from "@nuqaa-asir/shared";

const pricingTypeEnum = z.enum(["FIXED", "PROPERTY_SIZE", "HOURLY", "QUANTITY", "CUSTOM_QUOTE"]);

export const createServiceSchema = z.object({
  categoryId: z.string().uuid(),
  nameAr: z.string().trim().min(1).max(200),
  descriptionAr: z.string().trim().optional(),
  pricingType: pricingTypeEnum,
  basePrice: moneySchema.nullable().optional(),
  minimumPrice: moneySchema.nullable().optional(),
  defaultDurationMinutes: z.number().int().positive().default(60),
  requiresManualQuote: z.boolean().default(false),
});
export type CreateServiceInput = z.infer<typeof createServiceSchema>;

export const updateServiceSchema = createServiceSchema.partial().extend({
  active: z.boolean().optional(),
});
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;

// includeInactive is only honored for an authenticated ADMIN caller (see
// routes.ts) — a CUSTOMER or anonymous request always gets active-only.
export const listServicesQuerySchema = z.object({
  categoryId: z.string().uuid().optional(),
  includeInactive: z.coerce.boolean().optional(),
});
