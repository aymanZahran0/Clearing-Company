import { z } from "zod";
import { moneySchema } from "@nuqaa-asir/shared";

const frequencyEnum = z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY", "CUSTOM"]);

export const createSubscriptionSchema = z.object({
  customerId: z.string().uuid(),
  addressId: z.string().uuid(),
  serviceConfiguration: z.object({
    serviceId: z.string().uuid(),
    addOnIds: z.array(z.string().uuid()).default([]),
  }),
  frequency: frequencyEnum,
  preferredWeekday: z.number().int().min(0).max(6).optional(),
  preferredTimeWindow: z.string().trim().max(100).optional(),
  priceSnapshot: moneySchema,
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().optional(),
});
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;

export const updateSubscriptionSchema = createSubscriptionSchema.partial().omit({ customerId: true });
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;

export const listSubscriptionsQuerySchema = z.object({
  status: z.enum(["ACTIVE", "PAUSED", "CANCELLED"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
