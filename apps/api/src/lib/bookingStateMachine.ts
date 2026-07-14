import { ApiError } from "@nuqaa-asir/shared";
import type { BookingStatus } from "@prisma/client";

/**
 * Allowed BookingStatus transitions (data-model.md "State-transition
 * rules", research.md R5). Only the transitions a given phase actually
 * implements are exercised so far — the full table is defined up front so
 * later phases (US3-US6) don't need to touch this file's shape, only add
 * the route/service code that calls `assertTransition`.
 */
const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  DRAFT: ["PENDING", "CANCELLED"],
  PENDING: ["CONFIRMED", "REJECTED", "CANCELLED"],
  CONFIRMED: ["RESCHEDULED", "IN_PROGRESS", "CANCELLED", "COMPLAINT_OPENED"],
  RESCHEDULED: ["CONFIRMED", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: ["COMPLAINT_OPENED"],
  CANCELLED: [],
  REJECTED: [],
  COMPLAINT_OPENED: ["COMPLETED"], // returns to COMPLETED once the issue is resolved
};

export function assertTransition(from: BookingStatus, to: BookingStatus): void {
  if (!ALLOWED_TRANSITIONS[from]?.includes(to)) {
    throw new ApiError(
      409,
      "BOOKING_TRANSITION_INVALID",
      `Cannot move a booking from ${from} to ${to}`
    );
  }
}
