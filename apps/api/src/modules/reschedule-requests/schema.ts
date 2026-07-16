import { z } from "zod";

// data-model.md §1: requestedTimeSlotId is required here (deviating from
// contracts/reschedule-requests.md's "optional if free-form time" note)
// because approval reuses bookings/service.ts's rescheduleBooking(), which
// only supports slot-based capacity-checked rescheduling — there is no
// free-form-time path in the existing booking model to approve into.
export const submitRescheduleRequestSchema = z.object({
  requestedStartAt: z.coerce.date(),
  requestedTimeSlotId: z.string().uuid(),
  reason: z.string().trim().max(1000).optional(),
});
export type SubmitRescheduleRequestInput = z.infer<typeof submitRescheduleRequestSchema>;

export const approveRescheduleRequestSchema = z.object({
  overrideCapacity: z.boolean().default(false),
});
export type ApproveRescheduleRequestInput = z.infer<typeof approveRescheduleRequestSchema>;

export const rejectRescheduleRequestSchema = z.object({
  reason: z.string().trim().min(1).max(500),
});
export type RejectRescheduleRequestInput = z.infer<typeof rejectRescheduleRequestSchema>;

export const listRescheduleRequestsQuerySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "AUTO_REJECTED"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
