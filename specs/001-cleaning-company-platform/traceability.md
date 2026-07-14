# Requirements Traceability: spec.md → Implementation

Maps every Functional Requirement (FR-001–FR-079) and Success Criterion in `spec.md` to concrete Customer screens, Admin screens, backend module, database entities (`data-model.md`), API endpoint(s) (`contracts/openapi.yaml`), the CUSTOMER/ADMIN permission boundary, key validation rules, and the test layer expected to cover it. "CP" = Customer Portal route, "AD" = Admin Dashboard route.

## Roles, Access, and Auditability

| FR | Customer Screen | Admin Screen | Backend Module | DB Entities | API Endpoint(s) | Permission | Validation | Tests |
|---|---|---|---|---|---|---|---|---|
| FR-001 | n/a (implicit: unauthenticated + CP) | AD: all routes | Authentication | User | `/auth/*` | Public register/login; all else role-gated | `role` enum restricted to CUSTOMER/ADMIN at DB + Zod layer | Unit: role enum validation. Integration: role middleware rejects unknown roles |
| FR-002 | — | AD: login-gated shell | Authentication | User, RefreshToken | `/auth/login`, `/auth/refresh` | Admin only for internal routes | JWT signature + expiry checked on every request | Integration: 401 on missing/expired token |
| FR-003 | — | AD: all internal actions | Authentication middleware | — | all `/bookings`, `/customers`, `/reports`, etc. | Enforced server-side, not just UI-hidden | Middleware checks role before handler runs | Integration: direct API call as CUSTOMER to Admin-only route → 403 |
| FR-004 | — | AD: Audit Log viewer | Audit | AuditLog | `/audit-logs` (read); write is implicit on every mutating Admin action | Admin only | Audit write is transactional with the triggering action | Integration: price override/cancel/payment-change/export each produce exactly one AuditLog row |
| FR-005 | — | AD: Audit Log viewer, Booking detail → History tab | Audit | AuditLog, BookingStatusHistory | `/audit-logs`, `/bookings/{id}/history` | Admin only | Pagination + entityType filter | Contract: schema matches OpenAPI |

## Service Catalog & Selection

| FR | Customer Screen | Admin Screen | Backend Module | DB Entities | API Endpoint(s) | Permission | Validation | Tests |
|---|---|---|---|---|---|---|---|---|
| FR-006 | CP: Service Catalog, Service Detail | AD: Services list | Services | ServiceCategory, Service | `/services`, `/service-categories` | Public read | Category/service must be `active` to list publicly | Unit: catalog query excludes inactive |
| FR-007 | — | AD: Service editor | Services | Service, ServiceAddOn | `POST/PATCH /services`, `/service-add-ons` | Admin only | `requiresManualQuote` boolean; pricingType enum enforced | Unit: Zod schema |
| FR-008 | CP: Booking Wizard → Add-ons step | AD: Booking editor | Bookings, Services | BookingItem, ServiceAddOn | part of `POST /bookings` | Customer (own), Admin (any) | Exactly one primary service per booking enforced at DB/service layer | Integration: booking with 2 primary services rejected |
| FR-009 | CP: catalog auto-hides disabled items | AD: Service/Area toggle | Services | Service, ServiceArea | `PATCH /services/{id}`, `/service-areas/{id}` | Admin only | Soft-disable (`active=false`), never hard delete | Unit: disabled service excluded from public GET |

## Booking Request & Property/Address Details

| FR | Customer Screen | Admin Screen | Backend Module | DB Entities | API Endpoint(s) | Permission | Validation | Tests |
|---|---|---|---|---|---|---|---|---|
| FR-010 | CP: Booking Wizard (property/address/schedule steps) | AD: New Booking (phone) form | Bookings | Booking, CustomerAddress | `POST /bookings`, `/bookings/admin` | Customer (own), Admin (any) | Zod schema in `packages/shared`, shared client+server | Integration: missing required field → 422 with fieldErrors |
| FR-011 | CP: Booking Wizard condition-notes step | AD: New/Edit Booking notes | Bookings | Booking.propertyDetailsJson | same as FR-010 | Customer, Admin | Free-text length cap; condition modifiers from fixed enum | Unit: schema |
| FR-012 | CP: Address step (area check) | AD: Address step | Availability | ServiceArea, CustomerAddress | `GET /service-areas`, validated in `POST /bookings` | Public read; write scoped | Address `serviceAreaId` must be `active` | Integration: booking in disabled area → 409 |
| FR-013 | CP: submit button (idempotent) | AD: submit button | Bookings | Booking (unique constraint on idempotency key) | `POST /bookings` with `Idempotency-Key` header | Customer, Admin | Server-side idempotency-key table/constraint | Integration: duplicate submit → single row (E2E V1 in quickstart.md) |
| FR-014 | CP: Confirmation screen | AD: Booking detail header | Bookings | Booking.referenceNumber | `POST /bookings` response | Customer, Admin | Unique, human-readable, non-sequential-enough to resist guessing | Unit: reference generator uniqueness |
| FR-015 | CP: Booking Wizard consent checkbox | — | Bookings | Booking (consent flag, not persisted as PII) | `POST /bookings` | Customer, Admin (on behalf) | Required boolean, must be `true` | Unit: schema rejects `false`/missing |
| FR-016 | CP: guest not required — but see R6: web flow requires account, phone/Admin flow does not | AD: New Booking without password | Authentication, Bookings | User (status=INVITED) | `POST /bookings/admin` | Admin | Admin-created User may have `passwordHash = null` | Integration: Admin creates booking + customer, no password required |
| FR-017 | — | AD: Customer search (by phone) | Customers | User, CustomerProfile | `GET /customers?search=` | Admin only | Phone search uses normalized index | Integration: search matches normalized formats |
| FR-018 | — | AD: full New Booking flow, no CP interaction required | Bookings | Booking | `/bookings/admin` covers all fields in one call | Admin | Every field CP normally collects is present in `AdminBookingCreateRequest` | E2E: V2 in quickstart.md |

## Pricing & Quotation

| FR | Customer Screen | Admin Screen | Backend Module | DB Entities | API Endpoint(s) | Permission | Validation | Tests |
|---|---|---|---|---|---|---|---|---|
| FR-019 | CP: live price preview in wizard | AD: same preview | Pricing/Quotes | Service, PricingRule, Quote | `POST /quotes/estimate` | Public/Customer | Deterministic function of inputs (pure calculation) | Unit: same inputs → same output (property-based test) |
| FR-020 | CP: "pending review" badge | AD: manual-review queue | Pricing/Quotes | Quote.requiresManualReview | `POST /quotes/estimate` | Public/Customer | `requiresManualQuote` on Service forces flag | Unit |
| FR-021 | — | AD: Booking confirm dialog (price override) | Bookings | Booking, BookingStatusHistory, AuditLog | `POST /bookings/{id}/confirm` | Admin only | Reason required when `priceOverride` present | Integration: override without reason → 422 |
| FR-022 | CP: discount code field | AD: Discount Codes manager | DiscountCodes | DiscountCode | `/discount-codes`, `/discount-codes/validate` | Admin manages; Customer applies | `validFrom`/`validTo`/`usageLimit` enforced atomically | Integration: usage-limit race condition test |
| FR-023 | CP: price breakdown shows travel fee | AD: Service Area editor | Pricing | ServiceArea.travelFee | `/service-areas` | Admin manages; public reads via quote | — | Unit |
| FR-024 | CP: booking detail shows locked price | AD: booking detail shows locked price | Bookings | Booking snapshot fields, BookingItem | n/a (immutability is a write-path rule) | — | Snapshot fields set once at confirm, never recalculated | Integration: change Service.basePrice post-confirm, snapshot unchanged (quickstart V3) |
| FR-025 | CP: price breakdown includes tax line | AD: Settings → tax rate | Settings, Pricing | SystemSetting (`tax_rate`) | `/settings` | Admin manages | Tax stored as configurable value, not hard-coded | Unit |

## Scheduling

| FR | Customer Screen | Admin Screen | Backend Module | DB Entities | API Endpoint(s) | Permission | Validation | Tests |
|---|---|---|---|---|---|---|---|---|
| FR-026 | — | AD: Operating Hours settings | Availability | OperatingHours, ClosedDate | `/operating-hours`, `/closed-dates` | Admin only | Weekday 0–6, time range valid | Unit |
| FR-027 | CP: date/time picker (reads remaining capacity) | AD: Time Slots manager | Availability | TimeSlot | `/time-slots`, `GET /availability` | Admin manages; public reads | `capacity >= 0` | Unit |
| FR-028 | — | AD: "Needs Scheduling" queue | Bookings | Booking (status=CONFIRMED, scheduledStartAt=null) | `GET /bookings?status=CONFIRMED&unscheduled=true` | Admin only | — | Integration |
| FR-029 | — | AD: Schedule Booking dialog | Bookings | Booking.scheduledStartAt/EndAt, internalHandlingNote | `POST /bookings/{id}/schedule` | Admin only | No structured team/vehicle FK — free text only | Unit: schema rejects structured team object |
| FR-030 | — | AD: Schedule Booking dialog (capacity warning) | Availability, Bookings | TimeSlot.capacity/bookedCount | `POST /bookings/{id}/schedule` | Admin only | Blocks unless `overrideCapacity=true`, then audited | Integration: quickstart V4 |
| FR-031 | — | AD: Calendar (day/week view) | Bookings | Booking.scheduledStartAt | `GET /bookings?from=&to=` | Admin only | — | E2E: calendar renders scheduled bookings |
| FR-032 | CP: request-reschedule/cancel button (routes to Admin) | AD: Reschedule/Cancel dialog | Bookings | Booking, BookingStatusHistory | `/bookings/{id}/reschedule`, `/bookings/{id}/cancel` | Customer (own, cancel only), Admin (both) | Reason required | Integration |

## Booking Lifecycle & Status

| FR | Customer Screen | Admin Screen | Backend Module | DB Entities | API Endpoint(s) | Permission | Validation | Tests |
|---|---|---|---|---|---|---|---|---|
| FR-033 | CP: Booking Status timeline | AD: Booking detail status timeline | Bookings | Booking.status, BookingStatusHistory | all `/bookings/{id}/*` action endpoints | — | State machine enforced server-side (R5) | Unit: state-machine transition table |
| FR-034 | — | AD: Confirm action | Bookings | Booking | `POST /bookings/{id}/confirm` | Admin only | Requires price+address+date+contact | Integration: confirm with missing address → 409 |
| FR-035 | — | AD: Schedule action | Bookings | Booking | `POST /bookings/{id}/schedule` | Admin only | Requires start+end time | Integration |
| FR-036 | — | AD: Arrive/Start/Complete actions | Bookings, Checklists | Booking, ChecklistRun | `/arrive`, `/start`, `/complete` | Admin only | `start` requires `arrivedAt` set; `complete` requires checklist done | Integration: quickstart V5 |
| FR-037 | CP: cancel dialog (reason) | AD: cancel dialog (reason) | Bookings | Booking.cancellationReason, cancelledByRole | `POST /bookings/{id}/cancel` | Customer (own), Admin (any) | Reason required | Unit: schema |
| FR-038 | CP: read-only status history | AD: History tab | Bookings | BookingStatusHistory | `/bookings/{id}/history` | Customer (own, read), Admin (all) | Immutable append-only | Integration |
| FR-039 | — | AD: all transition actions | Bookings, Authentication | — | all transition endpoints | Admin only, except initial create + review | Middleware + explicit exception list for unauthenticated create/review | Integration: customer attempts admin transition → 403 |
| FR-040 | CP: cancel button, no fee shown | AD: cancel dialog, no fee field | Bookings | Booking | `POST /bookings/{id}/cancel` | Customer, Admin | No fee field exists in schema at all | Unit: schema has no fee/penalty field |

## Customer Management

| FR | Customer Screen | Admin Screen | Backend Module | DB Entities | API Endpoint(s) | Permission | Validation | Tests |
|---|---|---|---|---|---|---|---|---|
| FR-041 | CP: Profile page | AD: Customer detail | Customers | User, CustomerProfile | `/customers/me`, `/customers/{id}` | Customer (own), Admin (any) | Phone normalized on write | Unit: normalization function |
| FR-042 | — (never shown to customer) | AD: Customer detail → Internal Notes | Customers | CustomerProfile.internalNotes | `PATCH /customers/{id}` | Admin only, never in `/customers/me` response | Field excluded from Customer-facing serializer | Integration: `/customers/me` response never includes `internalNotes` |
| FR-043 | — | AD: Customer detail → Tags | Customers | CustomerProfile.tags | `PATCH /customers/{id}` | Admin only | Tags from a maintained set (free-text allowed but suggested) | Unit |
| FR-044 | — | AD: Customer merge tool | Customers | User, CustomerProfile, Booking (re-pointed) | `POST /customers/{id}/merge` | Admin only | Transactional re-pointing of all FKs | Integration: merge preserves booking history from both |

## Execution & Quality Checklist

| FR | Customer Screen | Admin Screen | Backend Module | DB Entities | API Endpoint(s) | Permission | Validation | Tests |
|---|---|---|---|---|---|---|---|---|
| FR-045 | — | AD: Checklist Template editor | Checklists | ChecklistTemplate, ChecklistTemplateItem | `/services/{id}/checklist-template` | Admin only | Item `type` excludes PHOTO | Unit: schema rejects `type: PHOTO` |
| FR-046 | — | AD: (implicit — booking always shows the version it ran with) | Checklists | ChecklistRun.templateVersionSnapshot | `GET /bookings/{id}/checklist` | Admin only | Snapshot taken at `start`, immutable after | Integration: template edited mid-run doesn't alter in-flight checklist |
| FR-047 | — | AD: Checklist execution + review screen | Checklists | ChecklistRun | `PATCH /bookings/{id}/checklist`, `/checklist/review` | Admin only | Both steps performed by same Admin role (R5/clarification) | E2E: quickstart V5 |
| FR-048 | — | AD: Complete action blocked with outstanding-items list | Checklists, Bookings | ChecklistResult | `POST /bookings/{id}/complete` | Admin only | All `required=true` items must have a value | Integration |
| FR-049 | — | AD: checklist item "flag issue" control | Checklists, QualityIssues | ChecklistResult.isIssue, QualityIssue | `PATCH /bookings/{id}/checklist` → triggers QualityIssue create | Admin only | `source=CHECKLIST_FAILURE` set automatically | Integration |

## Quality, Feedback, and Complaints

| FR | Customer Screen | Admin Screen | Backend Module | DB Entities | API Endpoint(s) | Permission | Validation | Tests |
|---|---|---|---|---|---|---|---|---|
| FR-050 | CP: Review/Rating form (post-completion) | AD: Reviews list | Reviews | Review | `POST /bookings/{id}/review` | Customer (own completed booking) | 1–5 integer, one review per booking | Integration: second review on same booking → 409 |
| FR-051 | — | AD: Complaint triage screen | QualityIssues | QualityIssue | `PATCH /quality-issues/{id}` | Admin only | severity enum, ownerUserId must be an Admin | Unit |
| FR-052 | — | AD: Close Complaint dialog | QualityIssues | QualityIssue.resolution | `PATCH /quality-issues/{id}` | Admin only | `resolution` required when `status=CLOSED` | Integration: close without resolution → 422 |
| FR-053 | — | AD: "Create Rework" button on complaint | QualityIssues, Bookings | Booking.originalBookingId, QualityIssue.reworkBookingId | `POST /quality-issues/{id}/rework` | Admin only | Copies customer/address from original, no re-entry | Integration |
| FR-054 | — | AD: Low-rating/aged-complaint alert banner | Reviews, QualityIssues | Review.followUpRequired, QualityIssue.createdAt | dashboard aggregation in `/reports/operations-summary` | Admin only | Rating ≤2 or issue age > configurable threshold | Unit: alert trigger logic |

## Subscriptions & Commercial Contracts

| FR | Customer Screen | Admin Screen | Backend Module | DB Entities | API Endpoint(s) | Permission | Validation | Tests |
|---|---|---|---|---|---|---|---|---|
| FR-055 | CP: read-only "My Subscriptions" | AD: Subscription editor | Subscriptions | Subscription | `POST /subscriptions` | Admin creates; Customer reads own | frequency enum, priceSnapshot required | Unit |
| FR-056 | CP: upcoming occurrences list | AD: subscription detail | Subscriptions | Booking (subscriptionId), Subscription.nextGenerationAt | background job (no direct endpoint) | System job, Admin-triggerable manually | Unique `(subscriptionId, occurrenceDate)` | Integration: quickstart V7 (double-run idempotency) |
| FR-057 | — | AD: occurrence editor | Subscriptions | Booking | `PATCH /subscriptions/{id}/occurrences/{bookingId}` | Admin only | Edits target booking only, not the Subscription row | Integration |
| FR-058 | — | AD: pause/resume/cancel controls | Subscriptions | Subscription.status | `/subscriptions/{id}/pause`\|`resume`\|`cancel` | Admin only | Cancel/pause never deletes generated Bookings | Integration |
| FR-059 | — | AD: Commercial Account editor | Commercial | CommercialAccount, CommercialLocation, Contract | `/commercial-accounts`, `/contracts` | Admin only | ≥1 location required | Unit |

## Payments

| FR | Customer Screen | Admin Screen | Backend Module | DB Entities | API Endpoint(s) | Permission | Validation | Tests |
|---|---|---|---|---|---|---|---|---|
| FR-060 | — | AD: Record Payment dialog | Payments | Payment | `POST /bookings/{id}/payments` | Admin only | method enum, amount > 0 | Unit |
| FR-061 | CP: payment status badge | AD: payment status badge | Payments | Payment.status | derived on `Booking`/`Payment` GET | Customer (own, read), Admin | status enum | Unit |
| FR-062 | — | AD: Discount approval on booking | Payments, Pricing | Booking.discountSnapshot, discountCodeId | part of `/bookings/{id}/confirm` | Admin only | reason + approving user captured in AuditLog | Integration |
| FR-063 | — | AD: Revenue report | Reports | Booking snapshots, Payment | `/reports/revenue` | Admin only | Uses snapshot fields only, never live catalog price | Unit: report query excludes live-price joins |
| FR-064 | CP: "pay on completion, offline" notice | AD: no online-payment UI at all | Payments | — (no online gateway integration exists) | — | — | No payment-gateway endpoint exists in this API surface | Static check: no card/gateway fields in schema |

## Notifications & Message Templates

| FR | Customer Screen | Admin Screen | Backend Module | DB Entities | API Endpoint(s) | Permission | Validation | Tests |
|---|---|---|---|---|---|---|---|---|
| FR-065 | CP: receives WhatsApp messages (external to app) | AD: Notification Templates editor | Notifications | NotificationTemplate | `/notification-templates` | Admin manages | one template per event key, Ar+En bodies | Unit |
| FR-066 | — | AD: booking detail → "Send via WhatsApp" button | Notifications | NotificationLog | `POST /bookings/{id}/notifications/send` | Admin only | Opens `wa.me` link with pre-filled template text | Integration |
| FR-067 | — | AD: Notification Log viewer | Notifications | NotificationLog | `/notifications/log` | Admin only | every attempt logged regardless of outcome | Unit |
| FR-068 | — | (implicit — booking actions succeed regardless) | Notifications, Bookings | — | any endpoint that triggers a notification | — | notification send wrapped so its failure can't roll back the DB transaction | Integration: force notification failure, confirm booking action still committed |

## Reporting & Dashboards

| FR | Customer Screen | Admin Screen | Backend Module | DB Entities | API Endpoint(s) | Permission | Validation | Tests |
|---|---|---|---|---|---|---|---|---|
| FR-069 | — | AD: Dashboard home | Reports | Booking | `/reports/operations-summary` | Admin only | — | Unit: quickstart V8 |
| FR-070 | — | AD: Revenue report | Reports | Booking, Payment | `/reports/revenue` | Admin only | date-range filter | Unit |
| FR-071 | — | AD: Customers report | Reports | CustomerProfile, Subscription | `/reports/revenue` (customer breakdown section) | Admin only | new-vs-repeat computed from booking count per customer | Unit |
| FR-072 | — | AD: Quality report | Reports | Booking, Review, QualityIssue | `/reports/quality` | Admin only | rates computed over selected date range | Unit |
| FR-073 | — | AD: Export button per report | Reports | — | `/reports/export.csv` | Admin only | export itself is AuditLog'd (FR-004) | Integration |
| FR-074 | — | AD: Export button (field-limited) | Reports | — | `/reports/export.csv` | Admin only | PII fields excluded per data-model.md classification | Unit: exported CSV columns checked against PII exclusion list |

## Language, Locale, and Data Integrity

| FR | Customer Screen | Admin Screen | Backend Module | DB Entities | API Endpoint(s) | Permission | Validation | Tests |
|---|---|---|---|---|---|---|---|---|
| FR-075 | CP: all screens, Ar default + En toggle | AD: all screens, Ar default + En toggle | Frontend i18n (react-i18next) | — | — | — | RTL verified via `ConfigProvider direction` + logical CSS | E2E: quickstart V10 |
| FR-076 | CP: price/date/phone display | AD: same | Frontend i18n + backend formatting utils | — | — | — | `Intl` APIs with `ar-SA`/`en-SA` locales | Unit |
| FR-077 | CP: booking-status public lookup page | — | Bookings | Booking (verification token) | `GET /bookings/reference/{ref}?token=` | Public, token-gated | token unguessable (min 128-bit random) | Integration: quickstart V9 |
| FR-078 | — | — | Logging | — | all endpoints (logging middleware) | — | log redaction middleware strips phone/address fields | Integration: quickstart V9 log grep |
| FR-079 | — | — | Data retention | all entities | — | — | no scheduled deletion job exists | Static check: no cron/job named "retention" or "purge" in codebase |

## Success Criteria → Verification Method

| SC | Verified By |
|---|---|
| SC-001 | E2E timing assertion in Playwright (quickstart V1) |
| SC-002 | Integration test over a seeded sample of quote requests, asserting no `null` price/review-flag state |
| SC-003 | Integration: idempotency-key duplicate-submit test |
| SC-004 | Unit: `confirm` transition guard test |
| SC-005 | Integration: quickstart V4 capacity-override test |
| SC-006 | Integration: quickstart V5 checklist-gating test |
| SC-007 | Integration: `CLOSED` requires `resolution` test |
| SC-008 | Integration: quickstart V7 double-run idempotency test |
| SC-009 | Integration: reports spot-check against seed data |
| SC-010 | Integration: AuditLog-per-sensitive-action test |
| SC-011 | E2E: quickstart V10 |
| SC-012 | E2E: quickstart V2 |
| SC-013 | Integration: quickstart V9 |
| SC-014 | Integration: quickstart V9 reference-lookup-without-token test |
