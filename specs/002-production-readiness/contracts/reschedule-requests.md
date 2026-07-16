# Contract: Reschedule Requests

New router: `apps/api/src/modules/reschedule-requests/routes.ts`, mounted in `apps/api/src/app.ts` alongside the existing module routers. Reuses `apps/api/src/modules/bookings/service.ts`'s `rescheduleBooking()` on approval (research.md R7).

## POST /bookings/:id/reschedule-requests

**Auth**: `authenticate` (Customer or Admin — Admin submitting on a customer's behalf follows the same ownership rules as always, per FR-018 of the 001 baseline).

**Body** (`apps/api/src/modules/reschedule-requests/schema.ts`):
```ts
{ requestedStartAt: string /* ISO datetime */, requestedTimeSlotId?: string, reason?: string }
```

**Behavior**:
- 404 if booking not found.
- 403 if the requesting user is a CUSTOMER and does not own the booking.
- 409 if the booking is not in a reschedulable state (must have `status = CONFIRMED` and a future `scheduledStartAt`) — mirrors FR-057.
- 409 if a `PENDING` `RescheduleRequest` already exists for this booking — FR-056.
- 201 with the created `RescheduleRequest` on success. Writes `AuditLog`.

## GET /admin/reschedule-requests

**Auth**: `authenticate` + `requireRole("ADMIN")`.

**Query**: `?status=PENDING|APPROVED|REJECTED|AUTO_REJECTED` (optional filter), pagination params matching existing list endpoints (e.g. `apps/api/src/modules/customers/service.ts` list pattern).

**Response**: paginated `RescheduleRequest[]`, each including the related `Booking` summary needed to render an approval queue (reference number, customer name, current vs. requested time).

## POST /admin/reschedule-requests/:id/approve

**Auth**: `authenticate` + `requireRole("ADMIN")`.

**Body**: `{ overrideCapacity?: boolean }` (passed through to `rescheduleBooking()` if the requested slot is at capacity, same escape hatch Admin already has today).

**Behavior**:
- 404 if request not found or not `PENDING`.
- Internally calls `rescheduleBooking(bookingId, { newStartAt: request.requestedStartAt, newTimeSlotId: request.requestedTimeSlotId, actorUserId, overrideCapacity })` — same capacity-check/transaction/audit behavior as the existing Admin-initiated reschedule endpoint.
- On success: `RescheduleRequest.status = APPROVED`, `decidedByUserId`, `decidedAt` set; triggers customer notification (FR-054) via `apps/api/src/modules/notifications/service.ts`'s `notify()` helper (research.md R5).
- On slot-capacity conflict without override: 409, request remains `PENDING`.

## POST /admin/reschedule-requests/:id/reject

**Auth**: `authenticate` + `requireRole("ADMIN")`.

**Body**: `{ reason: string }` (required — FR-054/FR-055 require a reason to be recorded and communicated).

**Behavior**: 404 if not found or not `PENDING`. Sets `status = REJECTED`, `decidedByUserId`, `decidedAt`, `reason`. Booking is untouched. Triggers customer notification of rejection + reason.

## Internal: booking cancellation side-effect

When `apps/api/src/modules/bookings/service.ts`'s existing cancel path runs on a booking that has a `PENDING` `RescheduleRequest`, it sets that request's `status = AUTO_REJECTED` with `reason: "Booking was cancelled"` in the same transaction (spec Edge Cases) — implemented as one additional statement inside the existing cancel transaction, not a new module.
