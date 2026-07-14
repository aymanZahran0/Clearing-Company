import { z } from "zod";

export const createPricingRuleSchema = z.object({
  serviceId: z.string().uuid(),
  ruleType: z.enum(["PROPERTY_TYPE", "AREA_BAND", "DAY_TIME", "CONDITION_MODIFIER"]),
  conditionsJson: z.record(z.unknown()),
  calculationType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
  amount: z.number(),
  priority: z.number().int().default(0),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
});
export type CreatePricingRuleInput = z.infer<typeof createPricingRuleSchema>;

// serviceId is intentionally excluded from updates — a pricing rule
// belongs to the service it was created for; move-between-services is not
// a supported operation (create a new rule on the target service instead).
export const updatePricingRuleSchema = createPricingRuleSchema
  .omit({ serviceId: true })
  .partial()
  .extend({
    active: z.boolean().optional(),
  });
export type UpdatePricingRuleInput = z.infer<typeof updatePricingRuleSchema>;
