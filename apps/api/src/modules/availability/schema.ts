import { z } from "zod";

export const availabilityQuerySchema = z.object({
  serviceId: z.string().uuid(),
  serviceAreaId: z.string().uuid(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;

export const operatingHoursSchema = z.array(
  z.object({
    weekday: z.number().int().min(0).max(6),
    openTime: z.string().regex(/^\d{2}:\d{2}$/),
    closeTime: z.string().regex(/^\d{2}:\d{2}$/),
    active: z.boolean().default(true),
  })
);

export const createClosedDateSchema = z.object({
  date: z.coerce.date(),
  reason: z.string().trim().optional(),
});

export const createTimeSlotSchema = z.object({
  date: z.coerce.date(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  capacity: z.number().int().positive(),
});
export type CreateTimeSlotInput = z.infer<typeof createTimeSlotSchema>;

export const updateTimeSlotSchema = z.object({
  capacity: z.number().int().positive().optional(),
  active: z.boolean().optional(),
});
