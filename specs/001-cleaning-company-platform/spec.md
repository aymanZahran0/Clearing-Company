# Feature Specification: Nuqaa Asir Cleaning Booking & Operations Platform

**Feature Branch**: `001-cleaning-company-platform`

**Created**: 2026-07-12

**Status**: Draft

**Input**: User description: "Build an Arabic-first responsive booking and operations platform for a professional cleaning company serving Abha and Khamis Mushait. Customers and customer-service agents must be able to request cleaning services, provide property and address details, receive an estimated or manually reviewed quote, choose an available appointment, and receive a booking reference. Internal staff must manage services, configurable prices, service areas, customers, bookings, teams, schedules, execution checklists, quality issues, feedback, recurring subscriptions, basic commercial contracts, manual payments, message templates, and operational reports. The MVP must support RTL, role-based access, auditable booking status transitions, conflict-free team assignment, and post-service quality follow-up. Online payments, native apps, live GPS, payroll, and inventory are deferred." (derived from `.specify/plan.md`, the approved implementation plan for this feature)

## Clarifications

### Session 2026-07-12

- Q: What customer/booking data retention and deletion policy should the platform enforce? → A: No automatic retention limit — customer and booking data is kept indefinitely by default.
- Q: Should before/after photo capture be part of this MVP's quality checklist? → A: No — photo capture is excluded entirely from this feature's scope and deferred to a later feature.
- Q: How far ahead should recurring subscriptions generate future booking occurrences? → A: An 8-week rolling horizon from the current date.
- Q: Should the MVP process/collect payment (and formal tax invoicing) through the website? → A: No — the website only captures bookings; all payment collection stays offline/manual, and formal e-invoicing (e.g., ZATCA) is out of scope.
- Q: What is the cancellation/no-show policy? → A: Free cancellation any time up until the scheduled appointment; no no-show fee is tracked or charged.

### Session 2026-07-12 (follow-up)

- Q: The platform is being reduced to exactly two roles — Customer and Admin — with internal staff (supervisors, drivers, cleaning employees, operations managers, customer-service agents) removed as separate accounts, represented only as optional free-text booking notes managed by Admin. With Team Leader/Field Supervisor roles removed, what should happen to on-site execution tracking and the quality checklist? → A: Keep the granular execution states (en route/arrived/started/completed) and the quality checklist, but Admin alone performs every step instead of a separate field-team account.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Customer Requests a Cleaning Service Online (Priority: P1)

A customer visiting the website browses available cleaning services, describes their property, provides their contact and address details, picks a preferred date and time, and submits a booking request. They receive a clear booking reference and know whether their price is final or pending review.

**Why this priority**: This is the primary lead-generation and revenue-entry channel for the business. Without it, the company has no self-service way to capture demand from its website, and every other workflow (quoting, scheduling, execution) has nothing to act on.

**Independent Test**: Can be fully tested by having a customer, using only a phone browser, complete the entire flow from service selection to receiving a booking reference — without needing any other part of the system to exist yet (quotes can be marked "pending review" and scheduling can happen later).

**Acceptance Scenarios**:

1. **Given** a customer is on the service catalog, **When** they select a service, provide property details (type, size/rooms), contact details, address, and a preferred date/time, and submit, **Then** the system creates a unique booking reference and shows either an estimated price or a clear message that the price requires manual review.
2. **Given** a customer has filled out the booking form, **When** they submit the same request twice in a row (e.g., by double-clicking submit or retrying after a slow connection), **Then** only one booking record is created.
3. **Given** a customer selects a city or neighborhood the company does not currently serve, **When** they attempt to continue, **Then** the system tells them the area is not currently serviced instead of accepting an unserviceable booking.
4. **Given** a customer omits a required field (e.g., phone number or address), **When** they attempt to submit, **Then** the system shows a clear, understandable error next to the relevant field without discarding the rest of their entries.
5. **Given** a customer completes a booking request, **When** the confirmation page loads, **Then** it displays a booking reference and an easy way to open a WhatsApp conversation with that reference pre-filled.

---

### User Story 2 - Admin Creates a Booking from a Phone or WhatsApp Call (Priority: P1)

Admin receives a call or WhatsApp message from a customer who wants to book a service. Admin looks up or creates the customer record, enters the requested service and preferred time, and submits the booking on the customer's behalf.

**Why this priority**: Many customers — particularly older customers — will never use the website directly and will always call in. Without this capability, the platform fails a primary, explicitly-required booking channel from day one, not just as a nice-to-have.

**Independent Test**: Can be fully tested by having Admin, using only the internal system, create a complete booking for a caller (using a test phone number) and confirm the booking appears in the same booking list and lifecycle as a web-submitted booking.

**Acceptance Scenarios**:

1. **Given** Admin searches by the caller's phone number, **When** a matching customer record exists, **Then** Admin can select that customer and their saved addresses instead of re-entering everything.
2. **Given** no matching customer exists, **When** Admin enters the caller's name, phone number, and address, **Then** the system creates a new customer record linked to the new booking.
3. **Given** Admin has entered a service and schedule for a caller, **When** Admin submits the booking, **Then** the booking enters the same review/scheduling queue as a self-service web booking.
4. **Given** Admin is entering a booking for a caller who cannot see a screen, **When** Admin completes every step of the booking (service, address, schedule, price, confirmation), **Then** no step requires the customer to interact with the website themselves.

---

### User Story 3 - Admin Reviews, Quotes, and Confirms a Booking (Priority: P1)

Admin reviews newly submitted booking requests, adjusts or approves the calculated price when needed, and confirms the booking so it becomes eligible for scheduling.

**Why this priority**: Nearly all real-world cleaning jobs need a human check on price and feasibility before work is committed. Without this step, the business either overcommits to incorrect prices or has no way to move a request from "submitted" to "actionable."

**Independent Test**: Can be tested by taking a pending booking request (created in User Story 1 or 2) and independently walking it through quote review and confirmation, verifying its status and stored price change accordingly.

**Acceptance Scenarios**:

1. **Given** a booking is flagged for manual price review, **When** Admin sets or overrides the price with a reason, **Then** the booking's price is saved and locked to that booking (later catalog price changes do not retroactively change it).
2. **Given** a booking has a price and all required details (service, address, schedule, contact), **When** Admin confirms it, **Then** its status changes to confirmed and it becomes visible in the scheduling queue.
3. **Given** a booking is missing a required detail (e.g., no address), **When** Admin attempts to confirm it, **Then** the system blocks the confirmation and explains what is missing.
4. **Given** any status change is made to a booking, **When** the change is saved, **Then** the system records who made the change, when, and why, in a way Admin can later review.

---

### User Story 4 - Admin Schedules a Booking and Records Internal Handling Notes (Priority: P2)

Admin takes confirmed bookings that have not yet been scheduled, sets a planned date/time, and optionally records a free-text internal note about who or what will handle the job (e.g., a name, team nickname, or vehicle) — without maintaining a separate staff or team account.

**Why this priority**: Confirmed bookings must reach a planned execution slot for the business to deliver the service and earn revenue. This is the bridge between "sold" and "delivered," now handled entirely by Admin without a structured staffing system.

**Independent Test**: Can be tested by taking a set of confirmed bookings and independently scheduling them, verifying that the configured time-slot capacity is never exceeded without an explicit recorded override, and that each scheduled booking's internal note is visible to Admin.

**Acceptance Scenarios**:

1. **Given** a confirmed, unscheduled booking, **When** Admin sets a planned start/end time and an optional internal note, **Then** the booking moves to a scheduled state.
2. **Given** a time slot has reached its configured capacity, **When** Admin attempts to schedule another booking into it, **Then** the system warns of the conflict unless Admin explicitly overrides, which is then recorded.
3. **Given** a booking has been scheduled, **When** Admin opens the day or week calendar view, **Then** the booking appears there with its planned time and internal note without delay.
4. **Given** Admin wants a view of all confirmed bookings that still need scheduling, **When** Admin opens that view, **Then** every such booking is shown, sorted so overdue ones are easy to spot.

---

### User Story 5 - Admin Tracks Execution and Completes the Quality Checklist (Priority: P2)

Admin works through the day's scheduled jobs: marking en route, arrival, and start; completing a service-specific quality checklist; and marking the job complete once required checklist items are satisfied. All steps are recorded by Admin rather than by a separate field-team account.

**Why this priority**: Consistent execution and documented quality remain the operational core of a cleaning business and directly drive the customer satisfaction and repeat-business goals of the project, even though a single Admin role — rather than a dedicated field-team account — performs every recording step.

**Independent Test**: Can be tested by taking a scheduled booking and independently walking it through arrival, execution, checklist completion, and completion, confirming the booking cannot be marked complete while required checklist items are unfinished — all performed by the Admin role alone.

**Acceptance Scenarios**:

1. **Given** a scheduled booking, **When** Admin marks en route, arrival, and start in sequence, **Then** each timestamp is recorded and visible immediately.
2. **Given** a job has started, **When** Admin opens the checklist, **Then** it shows the correct checklist for that specific service, with required items clearly marked.
3. **Given** required checklist items are incomplete, **When** Admin attempts to mark the booking complete, **Then** the system prevents completion and states which items are outstanding.
4. **Given** all required checklist items are completed, **When** Admin marks the job complete, **Then** the booking status updates to completed and a customer follow-up (feedback request) is queued.
5. **Given** a checklist item is flagged as failed or an issue is noted, **When** Admin records it, **Then** a quality issue record is created and linked to the booking for follow-up.

---

### User Story 6 - Customer Feedback and Complaint/Rework Handling (Priority: P2)

After a service is completed, a customer rates the service and may leave a complaint. Admin triages and resolves complaints, including scheduling a rework visit linked to the original booking when needed.

**Why this priority**: Post-service quality follow-up is called out explicitly as a required capability, and resolving dissatisfaction quickly is essential to repeat business and reputation in a local-services market.

**Independent Test**: Can be tested by taking a completed booking, submitting a low rating and complaint against it, and independently walking that complaint through categorization, resolution, and (if needed) creation of a linked rework booking.

**Acceptance Scenarios**:

1. **Given** a completed booking, **When** the customer submits a rating and optional comments, **Then** the feedback is stored and linked to that booking.
2. **Given** a customer submits a low rating or complaint, **When** Admin reviews it, **Then** Admin can categorize its severity and assign an internal owner.
3. **Given** a complaint requires a redo of the work, **When** Admin schedules a rework visit, **Then** the new booking is clearly linked to the original booking and does not require the customer to re-enter their details.
4. **Given** a complaint has been resolved, **When** Admin closes it, **Then** the system requires resolution notes before allowing the complaint to be marked closed.

---

### User Story 7 - Admin Manages Recurring Subscriptions and Commercial Contracts (Priority: P3)

Admin configures a recurring cleaning package for a customer (e.g., weekly or monthly) or a basic commercial contract for a business client, and the system generates future bookings on that schedule without Admin having to manually recreate each visit.

**Why this priority**: Recurring revenue (subscriptions and commercial contracts) is called out as a core part of the business model, but the business can launch and operate one-time bookings without it, making it lower priority than the core booking/execution/quality loop.

**Independent Test**: Can be tested by configuring a recurring package for a test customer and independently verifying that future bookings are generated on the correct schedule, and that pausing or canceling the subscription does not delete already-generated or completed bookings.

**Acceptance Scenarios**:

1. **Given** Admin configures a recurring package (frequency, preferred day, price), **When** the schedule runs, **Then** future booking occurrences are generated automatically up to a rolling 8-week horizon, without duplicates.
2. **Given** an active subscription, **When** Admin adjusts a single upcoming occurrence (e.g., reschedule one visit), **Then** the rest of the subscription's schedule is unaffected.
3. **Given** a customer wants to pause or cancel their subscription, **When** Admin does so, **Then** no further occurrences are generated, but past bookings and history remain intact.
4. **Given** a commercial client with multiple service locations, **When** Admin sets up their account and contract details, **Then** bookings for that client can be tied to the correct location and billing contact.

---

### User Story 8 - Admin Reviews Operational and Revenue Reports (Priority: P3)

Admin reviews dashboards and reports covering bookings, revenue, and customer satisfaction to understand how the business is performing.

**Why this priority**: Reporting is essential for running the business well but depends on the other workflows (bookings, execution, feedback) already producing real data, so it is naturally built and validated last.

**Independent Test**: Can be tested by generating a known set of bookings, payments, and feedback records, then independently verifying that dashboard totals and exported reports match those records exactly.

**Acceptance Scenarios**:

1. **Given** a range of completed and in-progress bookings exist, **When** Admin opens the operations dashboard, **Then** Admin sees accurate counts of today's bookings, unscheduled confirmed bookings, and overdue bookings.
2. **Given** bookings with recorded payments exist, **When** Admin opens the revenue report, **Then** totals reflect only recorded payments and confirmed price snapshots, correctly filtered by the selected date range.
3. **Given** Admin wants to share data outside the system, **When** Admin exports a filtered report to a spreadsheet-compatible file, **Then** the export excludes customer personal details not needed for the report's purpose.

### Edge Cases

- What happens when a customer submits a booking for a date/time slot that fills up between when they started the form and when they submit it? The system MUST reject the request with a clear message and offer alternative times rather than silently accepting an overbooked slot.
- What happens when a quote's manual-review window expires before a customer responds? The system MUST mark the quote expired and require Admin to re-issue it rather than letting a stale price be honored indefinitely.
- What happens when Admin updates the same booking from two different sessions at nearly the same time? The system MUST ensure the booking ends up in a single consistent state and does not silently lose one of the updates.
- What happens if the internal handling note on a scheduled booking (who/what is assigned) needs to change after scheduling? Admin MUST be able to update the note at any time without needing to change the booking's status.
- What happens when a customer requests cancellation after a booking has already been scheduled or dispatched (en route/arrived)? The system MUST require a cancellation reason and record who cancelled, and MUST free up the time slot's capacity for rescheduling, with no cancellation fee charged.
- What happens when a customer never responds to a submitted quote? The booking MUST remain visible in a "needs follow-up" or expired state rather than disappearing, so Admin can proactively re-engage.
- What happens when a required checklist item cannot be completed on-site (e.g., access to a certain room was denied)? The system MUST allow Admin to flag the reason so the booking is not stuck indeterminately, while still preventing an ordinary "silent skip."
- What happens when a customer has multiple addresses and Admin selects the wrong one? Address selection MUST clearly display the full address before submission so Admin can catch the error before confirming.
- What happens when the same phone number is used for what are actually two different customers (e.g., a shared family/office line)? Admin MUST be able to view and, if necessary, correct or merge customer records rather than the system silently overwriting one customer's data with another's.
- What happens when a recurring subscription's scheduled generation job runs twice for the same period (e.g., due to a retry)? The system MUST NOT create duplicate booking occurrences for the same subscription and period.
- What happens when a notification (e.g., WhatsApp template preparation) fails to send? The underlying booking action (creation, confirmation, status change) MUST still succeed; only the notification attempt is logged as failed for follow-up.
- What happens when a customer tries to view someone else's booking by guessing or incrementing a booking reference? The system MUST NOT reveal another customer's booking details from the reference alone.

## Requirements *(mandatory)*

### Functional Requirements

#### Roles, Access, and Auditability

- **FR-001**: System MUST support exactly two roles: Customer (no account required, public) and Admin (a single authenticated internal role with full access to all booking, scheduling, execution, quality, subscription, payment, notification, and reporting functionality). There is no separate account type for cleaning employees, drivers, supervisors, or customer-service staff.
- **FR-002**: System MUST require Admin to authenticate before accessing any internal booking, scheduling, customer, or reporting data.
- **FR-003**: System MUST enforce that internal actions can only be performed by an authenticated Admin, not merely hidden from an unauthenticated user's navigation.
- **FR-004**: System MUST record an audit entry — who, what, when, and, where applicable, why — for every price override, cancellation, scheduling override, payment change, administrator account change, and data export.
- **FR-005**: System MUST allow Admin to review the audit history for a booking or an administrative action.

#### Service Catalog & Selection

- **FR-006**: System MUST let customers and Admin browse a categorized catalog of cleaning services, including at minimum: comprehensive home/apartment/villa cleaning, steam cleaning of soft furnishings, post-construction and move-in/move-out cleaning, kitchen and bathroom deep cleaning, surface disinfection, water-tank cleaning, air-conditioner filter/unit cleaning, and recurring office/furnished-apartment cleaning.
- **FR-007**: System MUST let Admin configure which services and optional add-ons are offered, including whether a service always requires manual price review.
- **FR-008**: System MUST let a customer or Admin select one primary service plus any number of optional add-ons within a single booking.
- **FR-009**: System MUST let Admin enable or disable individual services and service areas without deleting their historical data.

#### Booking Request & Property/Address Details

- **FR-010**: System MUST let a customer or Admin create a booking request by providing: selected service(s), property type (apartment, villa, office, shop, clinic, furnished unit, or other), property size or room counts, contact name and phone number, city, neighborhood, address details, and a preferred date/time.
- **FR-011**: System MUST allow the customer or Admin to record condition details relevant to pricing or scheduling (e.g., post-construction, move-in/out, heavy soil, pets, stairs) and free-text notes.
- **FR-012**: System MUST validate that the requested service area (city/neighborhood) is currently serviced before accepting a bookable request, and MUST clearly inform the requester when it is not.
- **FR-013**: System MUST prevent duplicate booking records from being created when a request is submitted more than once in quick succession (e.g., accidental double-submit or network retry).
- **FR-014**: System MUST generate a unique, customer-facing booking reference for every submitted request and display/return it to the requester upon submission.
- **FR-015**: System MUST require explicit acceptance of terms/consent before a booking request can be submitted.
- **FR-016**: System MUST NOT require a customer to create a permanent account in order to submit a booking request.
- **FR-017**: System MUST let Admin look up an existing customer (primarily by phone number) and reuse their saved details and addresses when creating a booking on their behalf.
- **FR-018**: System MUST support every booking-creation step (service selection, address entry, scheduling, pricing, confirmation) being completed entirely by Admin on behalf of a customer who is not interacting with the system directly.

#### Pricing & Quotation

- **FR-019**: System MUST calculate an estimated price automatically for services and conditions where a deterministic pricing rule exists, based on factors such as service selected, property type, size/room count, service area, day/time, and condition modifiers.
- **FR-020**: System MUST clearly flag a booking as requiring manual price review whenever automatic pricing is not confidently applicable, rather than presenting an unreliable estimate as final.
- **FR-021**: System MUST let Admin review, adjust, or override a calculated price, requiring a reason for any override.
- **FR-022**: System MUST support percentage or fixed-amount discounts with a defined validity period and usage limit, applied only by Admin.
- **FR-023**: System MUST support a configurable travel fee tied to service area.
- **FR-024**: System MUST permanently record the exact price breakdown (service price, add-ons, discounts, travel fee, tax, total) that applied to a booking at the time it was confirmed, so later changes to catalog prices never alter a historical booking's recorded price.
- **FR-025**: System MUST support a configurable tax amount or rate on bookings without requiring a fixed, hard-coded rate.

#### Scheduling

- **FR-026**: System MUST let Admin configure operating hours by day of week, plus closed dates and exceptional hours.
- **FR-027**: System MUST let Admin define available time slots and each slot's remaining capacity.
- **FR-028**: System MUST let Admin view and manage confirmed bookings that still need scheduling, including a dedicated view of confirmed-but-unscheduled bookings.
- **FR-029**: System MUST let Admin record a planned start and end time on a confirmed booking, plus an optional free-text internal handling note (e.g., who or what vehicle is handling the job), without requiring a separate structured staff, team, or vehicle record.
- **FR-030**: System MUST warn Admin when scheduling a booking into a time slot that has already reached its configured capacity, and MUST block the scheduling unless Admin explicitly overrides, which is then recorded.
- **FR-031**: System MUST provide day and week calendar views of scheduled bookings.
- **FR-032**: System MUST let Admin reschedule a booking to a new date/time or cancel it, capturing a reason and the acting Admin user.

#### Booking Lifecycle & Status

- **FR-033**: System MUST track each booking through a defined lifecycle from initial request through completion (e.g., requested, needs review, quoted, customer approved, confirmed, scheduled, en route, arrived, in progress, quality review, completed), plus exception states for cancellation, no-show, reschedule, and rework.
- **FR-034**: System MUST prevent a booking from being confirmed unless it has a price, an address, a service date, and valid customer contact information.
- **FR-035**: System MUST prevent a booking from moving into the scheduled/execution phase unless it has a planned start and end time recorded by Admin.
- **FR-036**: System MUST require an arrival record before a booking can move to "in progress," and MUST require completion of mandatory checklist items and a completion timestamp before a booking can move to "completed."
- **FR-037**: System MUST require a reason and record the acting Admin user whenever a booking is cancelled.
- **FR-038**: System MUST record every status change to a booking, including the previous status, new status, actor, and timestamp, in a way Admin can review as history.
- **FR-039**: System MUST only allow booking status transitions to be performed by an authenticated Admin, except for a customer's initial booking submission and post-service feedback submission, neither of which require authentication.
- **FR-040**: System MUST allow a booking to be cancelled free of charge at any time up until its scheduled appointment time, and MUST NOT calculate, track, or charge a no-show or late-cancellation fee.

#### Customer Management

- **FR-041**: System MUST maintain a customer record (name, normalized phone number, optional email, preferred contact channel, marketing consent) that can be linked to multiple bookings and multiple addresses over time.
- **FR-042**: System MUST let Admin record internal notes on a customer that are never shown to the customer, separate from any customer-visible notes.
- **FR-043**: System MUST let Admin apply descriptive tags to a customer (e.g., VIP, commercial, complaint history, referral partner).
- **FR-044**: System MUST let Admin detect likely duplicate customer records and merge them, preserving booking history from both records.

#### Execution & Quality Checklist

- **FR-045**: System MUST provide a checklist template for each service, made up of required and optional items (e.g., yes/no, text, numeric, signature, or issue-flag items). Photo-based checklist items are out of scope for this feature.
- **FR-046**: System MUST snapshot the checklist template version in use at the time a booking's checklist is started, so later edits to the template do not alter a checklist already in progress or completed.
- **FR-047**: System MUST let Admin complete the checklist for a scheduled booking and mark it reviewed before the booking can be completed.
- **FR-048**: System MUST prevent a booking from being marked completed while any required checklist item is unfinished.
- **FR-049**: System MUST let Admin flag a checklist item as failed or as an issue, and MUST create a linked quality-issue record when this happens.

#### Quality, Feedback, and Complaints

- **FR-050**: System MUST let a customer submit a 1-to-5 rating and optional written feedback for a completed booking.
- **FR-051**: System MUST let Admin categorize a complaint by type and severity, assign an internal owner, and track it to resolution.
- **FR-052**: System MUST require resolution notes before a complaint can be closed.
- **FR-053**: System MUST let Admin create a rework booking that is explicitly linked to the original booking and its quality issue, without requiring the customer to re-enter their details.
- **FR-054**: System MUST alert Admin when a booking receives a low rating or an unresolved complaint beyond a defined age.

#### Subscriptions & Commercial Contracts

- **FR-055**: System MUST let Admin configure a recurring service package for a customer, specifying frequency (e.g., weekly, biweekly, monthly, or custom), preferred day/time, and price.
- **FR-056**: System MUST automatically generate future booking occurrences from an active subscription on its configured schedule, up to a rolling 8-week planning horizon, without creating duplicate occurrences even if the generation process runs more than once for the same period.
- **FR-057**: System MUST let Admin modify a single upcoming occurrence of a subscription without altering the subscription's overall schedule.
- **FR-058**: System MUST let Admin pause, resume, or cancel a subscription, and MUST preserve all historical bookings already generated from it.
- **FR-059**: System MUST support a basic commercial client account with billing contact information, one or more service locations, and basic contract details (dates, pricing terms, and a reference to supporting documentation).

#### Payments

- **FR-060**: System MUST let Admin manually record a payment against a booking, including method (e.g., cash, bank transfer, point of sale, complimentary, other), amount, date, and a reference note.
- **FR-061**: System MUST track a payment status for each booking (e.g., unpaid, partially paid, paid, refunded-recorded, waived).
- **FR-062**: System MUST let Admin record a discount with a reason and the approving Admin user.
- **FR-063**: System MUST base revenue figures only on confirmed price snapshots (FR-024) and recorded payments, not on live catalog prices.
- **FR-064**: System MUST NOT process or collect payment through the website or any online channel; the booking flow only captures a price/quote, and all actual payment collection happens through existing offline channels (cash, bank transfer, point-of-sale terminal) recorded manually by Admin after the fact. Formal fiscal/tax e-invoicing (e.g., ZATCA-compliant invoicing) is out of scope for this feature.

#### Notifications & Message Templates

- **FR-065**: System MUST provide pre-written Arabic message templates for key booking events: quote ready, booking confirmed, appointment reminder, team en route, service completed, feedback request, reschedule, cancellation, and rework scheduled.
- **FR-066**: System MUST let Admin quickly copy or open a pre-filled WhatsApp conversation using the appropriate template for a given booking and customer.
- **FR-067**: System MUST log every notification attempt (channel, template used, recipient, status, and failure reason if applicable).
- **FR-068**: System MUST ensure that a failed notification attempt never prevents or rolls back the underlying booking action it relates to.

#### Reporting & Dashboards

- **FR-069**: System MUST provide an operations dashboard showing, at minimum: today's bookings, unscheduled confirmed bookings, and delayed/overdue bookings.
- **FR-070**: System MUST provide revenue reporting broken down by day, week, and month, along with average order value.
- **FR-071**: System MUST provide reporting on new versus repeat customers, subscription counts, and estimated recurring revenue.
- **FR-072**: System MUST provide reporting on booking completion rate, cancellation rate, average customer rating, and complaint rate.
- **FR-073**: System MUST let Admin export filtered report data to a spreadsheet-compatible file.
- **FR-074**: System MUST exclude customer personal details not needed for a given report's purpose from exports by default.

#### Language, Locale, and Data Integrity

- **FR-075**: System MUST present all customer-facing and Admin-facing interfaces in Arabic with correct right-to-left presentation as the default, with an English-language mode available.
- **FR-076**: System MUST format dates, currency, and phone numbers according to Saudi/Arabic locale conventions in both the Arabic and English modes.
- **FR-077**: System MUST NOT expose a customer's full personal details (contact, exact address) via a booking reference alone; looking up a booking as a customer MUST require an additional unguessable verification element.
- **FR-078**: System MUST NOT record a customer's full phone number or exact address in general-purpose application logs.
- **FR-079**: System MUST retain customer and booking records indefinitely by default, with no automatic deletion or anonymization window applied to historical data.

### Key Entities

- **Customer**: A person or organization requesting cleaning services; holds contact details, preferred channel, marketing consent, internal tags/notes, and a history of bookings and addresses.
- **Address**: A serviceable location tied to a customer, including city, neighborhood, descriptive details, and optional map reference; associated with a service area for eligibility and travel-fee purposes.
- **Service Area**: A city or neighborhood the company currently serves, with an associated travel fee and an active/inactive status.
- **Service** (and **Add-On**): A cleaning offering in the catalog, with base/minimum pricing, typical duration, and whether it always requires manual price review; add-ons are optional extras attached to a booking.
- **Pricing Rule / Discount**: A configurable rule that adjusts price based on property type, area, size, timing, or condition modifiers; discounts have a reason, validity period, and usage limit.
- **Booking**: The central record of a requested or delivered cleaning job — selected services/add-ons, property and address details, schedule, status, price snapshot, an optional free-text internal handling note (who/what is handling the job), and links to customer, checklist, feedback, and payment records.
- **Booking Status History**: A chronological record of every status change on a booking, including who made it, when, and why.
- **Checklist Template / Checklist Run**: The versioned set of required and optional quality-control items defined per service, and the record of how a specific booking's checklist was completed by Admin.
- **Quality Issue**: A tracked problem (from a failed checklist item or a customer complaint) with category, severity, owner, resolution, and an optional link to a rework booking.
- **Feedback**: A customer's post-service rating and optional comments, linked to a specific booking.
- **Subscription**: A recurring service arrangement for a customer, defining frequency, schedule preferences, price, and the booking occurrences it generates.
- **Commercial Account / Contract**: A business client's account, its service locations, billing contact, and basic contract terms.
- **Payment**: A manually recorded payment against a booking, including method, amount, date, and reference.
- **Notification Log Entry**: A record of an attempted customer communication — channel, template, recipient, status, and failure reason if applicable.
- **Role**: One of exactly two roles in the system — Customer (unauthenticated, public) or Admin (authenticated, full internal access).
- **Audit Log Entry**: A record of a sensitive action taken by Admin — who, what, when, and (where applicable) why.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A customer can go from opening the service catalog to receiving a booking reference in under 5 minutes on a mobile phone.
- **SC-002**: At least 95% of booking requests are automatically assigned either a final estimated price or a clear "pending review" status, with no requests left in an ambiguous or missing-price state.
- **SC-003**: Zero duplicate bookings are created from repeated or retried submissions of the same request during testing and in production monitoring.
- **SC-004**: 100% of bookings that reach "confirmed" status have a complete, valid price, address, schedule, and contact record — none are confirmed with missing required information.
- **SC-005**: Zero bookings are scheduled into a time slot beyond its configured capacity without an explicit, recorded Admin override.
- **SC-006**: 100% of bookings marked "completed" have all required quality-checklist items satisfied at the time of completion.
- **SC-007**: Every submitted customer complaint has a recorded resolution (explanation, refund record, or rework visit) before it can be closed, with zero complaints closed without resolution notes.
- **SC-008**: Recurring subscriptions generate the correct number of upcoming booking occurrences with zero duplicate occurrences, even when the generation process is retried.
- **SC-009**: Revenue and operational dashboard figures match underlying booking and payment records exactly when spot-checked against a known test dataset.
- **SC-010**: 100% of price overrides, cancellations, scheduling overrides, payment changes, administrator account changes, and data exports have a corresponding audit record.
- **SC-011**: Every screen and workflow in the system remains fully usable, without loss of function, when tested in Arabic with right-to-left layout on a phone-sized screen.
- **SC-012**: Admin can complete every step of a booking on behalf of a phone caller without the caller needing to view or interact with the website themselves.
- **SC-013**: An unauthenticated user is denied access in 100% of attempts to reach internal Admin functionality, sensitive customer data, or financial reports.
- **SC-014**: A booking reference alone, without the accompanying verification element, cannot be used to retrieve another customer's full personal or booking details.

## Assumptions

1. The initial release is a responsive web experience reachable from any modern mobile or desktop browser; native mobile apps are out of scope for this feature.
2. Arabic is the default language and right-to-left layout for all customer-facing and Admin-facing screens; English is available as a fully supported secondary language.
3. Customers are not required to create or maintain a permanent account to submit a booking request; Admin, however, must always authenticate.
4. Prices can be calculated automatically where a reliable rule exists, but remain reviewable and overridable by Admin for every booking.
5. Payments are recorded manually against a booking (cash, bank transfer, point of sale, complimentary, or other); online payment collection is not part of this feature.
6. WhatsApp communication in this feature consists of pre-written templates and click-to-chat links prepared by Admin or the system; fully automated, provider-integrated WhatsApp messaging is not required for this feature to be considered complete.
7. Service availability (what can be booked, when) is governed by service area, date, time slot, and configured slot capacity.
8. A booking may include exactly one primary service plus any number of add-ons.
9. Before-and-after photo capture is excluded entirely from this feature's scope; it may be introduced in a later feature with its own consent, storage, and retention rules.
10. The platform recognizes exactly two roles — Customer (no account required) and Admin (a single authenticated internal role). Cleaning personnel, drivers, and supervisors are managed entirely outside the system as a physical business operation; any reference to who is handling a specific job is captured only as an optional free-text internal note on the booking, not as a structured staff or team record.
11. "Older customers booking by phone" are served entirely through the Admin-assisted phone/WhatsApp booking workflow (User Story 2); no separate accessibility mode outside standard WCAG 2.1 AA conformance is assumed necessary for this population, since they do not interact with the interface directly.
12. Government licensing, staff recruitment/payroll, vehicle and equipment procurement, and marketing campaign execution are business-operational activities outside this platform's scope; only lead capture and reporting related to marketing are included.
13. Execution tracking (en route, arrived, started, completed) and the quality checklist are retained in this feature, but every step is recorded by Admin rather than by a separate field-team account; timestamps reflect when Admin records the status, not automatic device-based detection.
