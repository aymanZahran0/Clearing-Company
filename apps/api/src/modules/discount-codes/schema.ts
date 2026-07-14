import { z } from "zod";
import { moneySchema } from "@nuqaa-asir/shared";

export const validateDiscountCodeSchema = z.object({
  code: z.string().trim().min(1),
  quoteId: z.string().uuid(),
});
export type ValidateDiscountCodeInput = z.infer<typeof validateDiscountCodeSchema>;

export const createDiscountCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-]+$/),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  amount: z.number().positive(),
  minOrderValue: moneySchema.optional(),
  validFrom: z.coerce.date(),
  validTo: z.coerce.date(),
  usageLimit: z.number().int().positive().optional(),
});
export type CreateDiscountCodeInput = z.infer<typeof createDiscountCodeSchema>;

export const updateDiscountCodeSchema = createDiscountCodeSchema.partial().extend({
  active: z.boolean().optional(),
});
export type UpdateDiscountCodeInput = z.infer<typeof updateDiscountCodeSchema>;
