import { z } from "zod";

export const reportRangeQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const exportQuerySchema = reportRangeQuerySchema.extend({
  includePii: z.coerce.boolean().default(false),
});
