# Phase 1 Data Model: Production Readiness

Derived from `spec.md` Key Entities and `research.md`. Conventions match `specs/001-cleaning-company-platform/data-model.md`: `id` fields are UUIDs, all entities have `createdAt`/`updatedAt` unless noted, money fields are integer minor units, `*Ar`/`*En` field pairs back the bilingual requirement.

Two genuinely new tables are needed (§1, §2). Everything else this feature touches already exists in `apps/api/prisma/schema.prisma` and is reused as-is (§3).

---

## 1. RescheduleRequest

A customer-submitted request to move a specific booking to a new date/time, awaiting Admin approval or rejection (spec Outcome 12, FR-052–FR-058).

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| bookingId | UUID, FK → Booking | the booking being rescheduled |
| requestedByUserId | UUID, FK → User | the customer who submitted it |
| requestedStartAt | datetime | customer's preferred new start time |
| requestedTimeSlotId | UUID, nullable, FK → TimeSlot | if the UI offers slot selection rather than free-form time |
| status | enum `PENDING` \| `APPROVED` \| `REJECTED` \| `AUTO_REJECTED` | `AUTO_REJECTED` covers the edge case where the underlying booking is cancelled while a request is still pending |
| reason | string, nullable | customer's stated reason for requesting, or Admin's reason for rejecting |
| decidedByUserId | UUID, nullable, FK → User | Admin who approved/rejected |
| decidedAt | datetime, nullable | |
| createdAt / updatedAt | datetime | |

**Validation**:
- `bookingId` must reference a booking with `status = CONFIRMED` (or `RESCHEDULED`, mid-transition) and a future `scheduledStartAt`, and `requestedByUserId` must equal that booking's `customer.userId` (ownership check) — FR-052, FR-057.
- At most one `PENDING` `RescheduleRequest` per `bookingId` at a time (partial unique index on `bookingId` where `status = 'PENDING'`) — FR-056.
- Approval delegates the actual slot/capacity/status mutation to the existing `rescheduleBooking()` in `apps/api/src/modules/bookings/service.ts` (research.md R7) rather than duplicating that logic here; this table only tracks the request/decision envelope.

**Indexes**: index(bookingId), index(status), unique(bookingId) where status = 'PENDING'.

**Audit**: every insert/approve/reject writes an `AuditLog` row (existing model) with `entityType: "RescheduleRequest"` — FR-055.

---

## 2. JobRun

A record of one execution of a scheduled background job, used both to enforce the advisory-lock skip behavior and to give Admin visibility into job health (spec Outcome 9, FR-038–FR-043; research.md R1–R2).

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| jobName | enum `EXPIRE_STALE_QUOTES` \| `FLAG_OVERDUE_BOOKINGS` \| `GENERATE_SUBSCRIPTION_OCCURRENCES` | matches the three files in `apps/api/src/jobs/` |
| startedAt | datetime | |
| finishedAt | datetime, nullable | null while running |
| status | enum `SUCCESS` \| `FAILURE` \| `SKIPPED_LOCKED` | `SKIPPED_LOCKED` = advisory lock already held by a concurrent/overlapping run |
| detail | Json, nullable | e.g. `{ occurrencesCreated: 4 }`, `{ quotesExpired: 2 }`, `{ bookingsFlagged: 1 }` |
| failureReason | string, nullable | populated when `status = FAILURE` |

**Validation**: Every job invocation (including skipped ones) writes exactly one row — no invocation may complete without a corresponding `JobRun` (FR-040, FR-041).

**Indexes**: index(jobName), index(status), index(startedAt).

**Exposed via**: `GET /admin/job-runs` (see `contracts/health-and-jobs.md`) for Admin-visible job history (FR-041) and for any external monitoring/alerting to poll (research.md R15).

---

## 3. Reused Entities (no schema change)

These already exist in `apps/api/prisma/schema.prisma` and are extended in behavior/consumption only, not in shape, by this feature:

| Entity | Existing location | How this feature uses it |
|---|---|---|
| `User` (`role`, `status: ACTIVE\|INVITED\|SUSPENDED`) | schema.prisma:44 | Admin-account lifecycle (Outcome 8) reuses `status` verbatim; no new enum values. Last-active-Admin protection is a service-layer guard (`admin-accounts/service.ts`), not a schema constraint. |
| `PasswordResetToken` | schema.prisma:102 | Reused unchanged for both Admin self-service reset (existing `forgotPassword`/`resetPassword`) and Admin-mediated reset-another-Admin (new `admin-accounts/service.ts` issues a token the same way). |
| `AuditLog` | schema.prisma:115 | Reused unchanged as the audit sink for `RescheduleRequest` actions and every Admin-account action (invite/create/suspend/reactivate/reset). |
| `NotificationTemplate` / `NotificationLog` (`channel: WHATSAPP\|SMS\|EMAIL`, `status: SENT\|FAILED\|PENDING`) | schema.prisma:145,158 | Already shaped for all three channels; this feature makes `SMS`/`EMAIL` actually dispatch (research.md R3/R4/R5) instead of only `WHATSAPP` being log-only. No new fields. |
| `ServiceCategory` (`sortOrder`, `active`) / `Service` (`active`) / `ServiceAddOn` (`active`) | schema.prisma:284,296,344 | Already support ordering/activation at the API layer; this feature adds only the Admin UI (research.md R8), no schema or endpoint change. |
| `WebsiteContentBlock` / `FaqItem` (bilingual, `sortOrder`, `active`) | schema.prisma:860,874 | Already fully modeled and Admin-editable; this feature adds only public-site consumption (research.md R9), no schema change. |
| `Booking.rescheduleBooking()` transaction | `apps/api/src/modules/bookings/service.ts:431` | Reused verbatim as the mechanism an *approved* `RescheduleRequest` invokes — this feature does not reimplement slot-capacity or status-transition logic. |

## Migration Plan

One new migration, `apps/api/prisma/migrations/<timestamp>_production_readiness/`, adds exactly:
- `RescheduleRequest` table + `RescheduleRequestStatus` enum + partial unique index.
- `JobRun` table + `JobName` and `JobRunStatus` enums.

No column is added to, removed from, or retyped on any existing table — every other capability in this feature is additive code against the existing schema (per §3), keeping the migration minimal and low-risk to apply against a live production database (spec FR-002/FR-004).
