import { z } from "zod";

export const createCommercialAccountSchema = z.object({
  companyName: z.string().trim().min(1).max(200),
  billingContactName: z.string().trim().min(1).max(200),
  billingContactPhone: z.string().trim().min(1).max(30),
  billingContactEmail: z.string().trim().email().optional(),
  notes: z.string().trim().max(2000).optional(),
});
export type CreateCommercialAccountInput = z.infer<typeof createCommercialAccountSchema>;

export const updateCommercialAccountSchema = createCommercialAccountSchema.partial();

export const createCommercialLocationSchema = z.object({
  addressId: z.string().uuid(),
  label: z.string().trim().max(200).optional(),
});

export const createContractSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  pricingTerms: z.record(z.unknown()),
  documentReference: z.string().trim().max(500).optional(),
});
export type CreateContractInput = z.infer<typeof createContractSchema>;

export const updateContractSchema = createContractSchema.partial().extend({
  status: z.enum(["ACTIVE", "EXPIRED", "TERMINATED"]).optional(),
});
