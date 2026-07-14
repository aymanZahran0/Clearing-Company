import { z } from "zod";

const propertyTypeEnum = z.enum([
  "APARTMENT",
  "VILLA",
  "OFFICE",
  "SHOP",
  "CLINIC",
  "FURNISHED_UNIT",
  "OTHER",
]);

export const quoteEstimateRequestSchema = z.object({
  serviceId: z.string().uuid(),
  addOnIds: z.array(z.string().uuid()).default([]),
  propertyType: propertyTypeEnum,
  // Free-form per FR-010/FR-011 (rooms, area, condition modifiers); the
  // pricing lib only reads `sizeMultiplier` out of this for non-FIXED
  // pricing types, computed client-side from rooms/area and validated
  // loosely here since its exact shape varies by service.
  propertySizeInput: z.object({
    sizeMultiplier: z.number().positive().optional(),
    rooms: z.number().int().min(0).optional(),
    areaSqm: z.number().positive().optional(),
    conditionModifiers: z.array(z.string()).default([]),
  }),
  addressId: z.string().uuid().optional(),
  serviceAreaId: z.string().uuid().optional(),
  requestedDate: z.coerce.date(),
  requestedTimeSlotId: z.string().uuid().optional(),
  discountCode: z.string().trim().optional(),
});
export type QuoteEstimateRequest = z.infer<typeof quoteEstimateRequestSchema>;
