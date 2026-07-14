import { z } from "zod";
import { consentSchema, saudiPhoneSchema } from "@nuqaa-asir/shared";

const propertyTypeEnum = z.enum([
  "APARTMENT",
  "VILLA",
  "OFFICE",
  "SHOP",
  "CLINIC",
  "FURNISHED_UNIT",
  "OTHER",
]);

export const bookingCreateSchema = z.object({
  quoteId: z.string().uuid(),
  addressId: z.string().uuid(),
  propertyType: propertyTypeEnum,
  propertyDetails: z.record(z.unknown()).default({}),
  preferredDate: z.coerce.date(),
  preferredTimeSlotId: z.string().uuid().optional(),
  contactName: z.string().trim().min(2).max(200),
  contactPhone: saudiPhoneSchema,
  customerNotes: z.string().trim().max(2000).optional(),
  consentAccepted: consentSchema,
});
export type BookingCreateInput = z.infer<typeof bookingCreateSchema>;

export const adminBookingCreateSchema = bookingCreateSchema.extend({
  customerId: z.string().uuid().optional(),
  newCustomer: z
    .object({
      fullName: z.string().trim().min(2).max(200),
      phone: saudiPhoneSchema,
    })
    .optional(),
});
export type AdminBookingCreateInput = z.infer<typeof adminBookingCreateSchema>;

export const listBookingsQuerySchema = z.object({
  status: z
    .enum([
      "DRAFT",
      "PENDING",
      "CONFIRMED",
      "RESCHEDULED",
      "IN_PROGRESS",
      "COMPLETED",
      "CANCELLED",
      "REJECTED",
      "COMPLAINT_OPENED",
    ])
    .optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  // T112: calendar-range query against `scheduledStartAt`, distinct from
  // `from`/`to` above which filter on `createdAt` for the general
  // filterable Admin list — a calendar view needs "what's happening on
  // this day", not "what was created on this day".
  scheduledFrom: z.coerce.date().optional(),
  scheduledTo: z.coerce.date().optional(),
  // FR-029/T112: "needs scheduling" filter — CONFIRMED bookings with no
  // scheduledStartAt yet, used by the Admin calendar/queue views.
  needsScheduling: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const bookingReferenceLookupQuerySchema = z.object({
  token: z.string().min(1),
});

// T110/T111 (US4): schedule/reschedule share the same shape — pick a
// TimeSlot (capacity-checked) and optionally leave an internal note.
export const scheduleBookingSchema = z.object({
  timeSlotId: z.string().uuid(),
  internalHandlingNote: z.string().trim().max(2000).optional(),
  overrideCapacity: z.boolean().default(false),
});
export type ScheduleBookingInput = z.infer<typeof scheduleBookingSchema>;

export const cancelBookingSchema = z.object({
  reason: z.string().trim().min(1).max(500),
});
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
