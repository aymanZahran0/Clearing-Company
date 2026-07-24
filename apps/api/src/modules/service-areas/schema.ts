import { z } from "zod";
import { moneySchema } from "@nuqaa-asir/shared";

export const createServiceAreaSchema = z.object({
  nameAr: z.string().trim().min(1).max(200),
  city: z.string().trim().max(200).default(""),
  travelFee: moneySchema.default(0),
});
export type CreateServiceAreaInput = z.infer<typeof createServiceAreaSchema>;

export const updateServiceAreaSchema = createServiceAreaSchema.partial().extend({
  active: z.boolean().optional(),
});
export type UpdateServiceAreaInput = z.infer<typeof updateServiceAreaSchema>;

// includeInactive is only honored for an authenticated ADMIN caller (see
// routes.ts) — a CUSTOMER or anonymous request always gets active-only,
// regardless of this flag.
export const listServiceAreasQuerySchema = z.object({
  includeInactive: z.coerce.boolean().optional(),
});
export type ListServiceAreasQuery = z.infer<typeof listServiceAreasQuerySchema>;
