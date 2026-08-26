import { z } from "zod";

export const availabilityQuerySchema = z.object({
  serviceId: z.string().uuid(),
  serviceAreaId: z.string().uuid(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;
