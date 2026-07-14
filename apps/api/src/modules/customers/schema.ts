import { z } from "zod";
import { saudiPhoneSchema } from "@nuqaa-asir/shared";

export const updateOwnProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(200).optional(),
  email: z.string().trim().email().optional(),
  preferredChannel: z.enum(["PHONE", "WHATSAPP", "EMAIL"]).optional(),
  marketingConsent: z.boolean().optional(),
});
export type UpdateOwnProfileInput = z.infer<typeof updateOwnProfileSchema>;

// FR-041/FR-042/FR-043: Admin can additionally set internal notes/tags
// that are never exposed to the customer.
export const adminUpdateCustomerSchema = updateOwnProfileSchema.extend({
  internalNotes: z.string().trim().max(5000).optional(),
  tags: z.array(z.string().trim().min(1).max(50)).optional(),
});
export type AdminUpdateCustomerInput = z.infer<typeof adminUpdateCustomerSchema>;

export const createCustomerSchema = z.object({
  fullName: z.string().trim().min(2).max(200),
  phone: saudiPhoneSchema,
});
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

export const listCustomersQuerySchema = z.object({
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
