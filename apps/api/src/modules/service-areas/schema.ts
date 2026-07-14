import { z } from "zod";
import { moneySchema } from "@nuqaa-asir/shared";

export const createServiceAreaSchema = z.object({
  nameAr: z.string().trim().min(1).max(200),
  nameEn: z.string().trim().min(1).max(200),
  city: z.string().trim().min(1).max(200),
  travelFee: moneySchema.default(0),
});
export type CreateServiceAreaInput = z.infer<typeof createServiceAreaSchema>;

export const updateServiceAreaSchema = createServiceAreaSchema.partial().extend({
  active: z.boolean().optional(),
});
export type UpdateServiceAreaInput = z.infer<typeof updateServiceAreaSchema>;
