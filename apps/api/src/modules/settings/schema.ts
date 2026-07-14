import { z } from "zod";

export const updateSettingSchema = z.object({
  key: z.string().trim().min(1).max(100),
  value: z.unknown(),
  description: z.string().trim().max(500).optional(),
});
export type UpdateSettingInput = z.infer<typeof updateSettingSchema>;
