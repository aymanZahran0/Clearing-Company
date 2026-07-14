import { z } from "zod";
import { moneySchema } from "@nuqaa-asir/shared";

export const createServiceAddOnSchema = z.object({
  serviceId: z.string().uuid(),
  nameAr: z.string().trim().min(1).max(200),
  nameEn: z.string().trim().min(1).max(200),
  pricingMode: z.enum(["FIXED", "PER_QUANTITY"]).default("FIXED"),
  unitPrice: moneySchema,
  durationImpactMinutes: z.number().int().min(0).default(0),
});
export type CreateServiceAddOnInput = z.infer<typeof createServiceAddOnSchema>;

export const updateServiceAddOnSchema = createServiceAddOnSchema.partial().extend({
  active: z.boolean().optional(),
});
export type UpdateServiceAddOnInput = z.infer<typeof updateServiceAddOnSchema>;

export const listAddOnsQuerySchema = z.object({
  serviceId: z.string().uuid().optional(),
});
