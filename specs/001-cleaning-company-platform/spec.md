# Feature Specification: Nuqaa Asir Cleaning Booking & Operations Platform

**Feature Branch**: `001-cleaning-company-platform`

**Created**: 2026-07-12

**Status**: Draft

**Input**: User description: "Build an Arabic-first responsive booking and operations platform for a professional cleaning company serving Abha and Khamis Mushait. Customers and customer-service agents must be able to request cleaning services, provide property and address details, receive an estimated or manually reviewed quote, choose an available appointment, and receive a booking reference. Internal staff must manage services, configurable prices, service areas, customers, bookings, teams, schedules, execution checklists, quality issues, feedback, recurring subscriptions, basic commercial contracts, manual payments, message templates, and operational reports. The MVP must support RTL, role-based access, auditable booking status transitions, conflict-free team assignment, and post-service quality follow-up. Online payments, native apps, live GPS, payroll, and inventory are deferred." (derived from `.specify/plan.md`, the approved implementation plan for this feature)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Customer Requests a Cleaning Service Online (Priority: P1)

A customer visiting the website browses available cleaning services, describes their property, provides their contact and address details, picks a preferred date and time, and submits a booking request. They receive a clear booking reference and know whether their price is final or pending review.

**Why this priority**: This is the primary lead-generation and revenue-entry channel for the business. Without it, the company has no self-service way to capture demand from its website, and every other workflow (quoting, scheduling, execution) has nothing to act on.

**Independent Test**: Can be fully tested by having a customer, using only a phone browser, complete the entire flow from service selection to receiving a booking reference — without needing any other part of the system to exist yet (quotes can be marked "pending review" and assignment can happen later).

**Acceptance Scenarios**:

1. **Given** a customer is on the service catalog, **When** they select a service, provide property details (type, size/rooms), contact details, address, and a preferred date/time, and submit, **Then** the system creates a unique booking reference and shows either an estimated price or a clear message that the price requires manual review.
2. **Given** a customer has filled out the booking form, **When** they submit the same request twice in a row (e.g., by double-clicking submit or retrying after a slow connection), **Then** only one booking record is created.
3. **Given** a customer selects a city or neighborhood the company does not currently serve, **When** they attempt to continue, **Then** the system tells them the area is not currently serviced instead of accepting an unserviceable booking.
4. **Given** a customer omits a required field (e.g., phone number or address), **When** they attempt to submit, **Then** the system shows a clear, understandable error next to the relevant field without discarding the rest of their entries.
5. **Given** a customer completes a booking request, **When** the confirmation page loads, **Then** it displays a booking reference and an easy way to open a WhatsApp conversation with that reference pre-filled.

---

### User Story 2 - Agent Creates a Booking from a Phone or WhatsApp Call (Priority: P1)

A customer-service agent receives a call or WhatsApp message from a customer who wants to book a service. The agent looks up or creates the customer record, enters the requested service and preferred time, and submits the booking on the customer's behalf.

**Why this priority**: Many customers — particularly older customers — will never use the website directly and will always call in. Without this capability, the platform fails a primary, explicitly-required booking channel from day one, not just as a nice-to-have.

**Independent Test**: Can be fully tested by having an agent, using only the internal system, create a complete booking for a caller (using a test phone number) and confirm the booking appears in the same booking list and lifecycle as a web-submitted booking.

**Acceptance Scenarios**:

1. **Given** an agent searches by the caller's phone number, **When** a matching customer record exists, **Then** the agent can select that customer and their saved addresses instead of re-entering everything.
2. **Given** no matching customer exists, **When** the agent enters the caller's name, phone number, and address, **Then** the system creates a new customer record linked to the new booking.
3. **Given** an agent has entered a service and schedule for a caller, **When** they submit the booking, **Then** the booking enters the same review/scheduling queue as a self-service web booking, with a record of which agent created it.
4. **Given** an agent is entering a booking for a caller who cannot see a screen, **When** the agent completes every step of the booking (service, address, schedule, price, confirmation), **Then** no step requires the customer to interact with the website themselves.

---

### User Story 3 - Operations Reviews, Quotes, and Confirms a Booking (Priority: P1)

An operations manager or authorized agent reviews newly submitted booking requests, adjusts or approves the calculated price when needed, and confirms the booking so it becomes eligible for scheduling.

**Why this priority**: Nearly all real-world cleaning jobs need a human check on price and feasibility before a team is committed. Without this step, the business either overcommits to incorrect prices or has no way to move a request from "submitted" to "actionable."

**Independent Test**: Can be tested by taking a pending booking request (created in User Story 1 or 2) and independently walking it through quote review and confirmation, verifying its status and stored price change accordingly.

**Acceptance Scenarios**:

1. **Given** a booking is flagged for manual price review, **When** an authorized staff member sets or overrides the price with a reason, **Then** the booking's price is saved and locked to that booking (later catalog price changes do not retroactively change it).
2. **Given** a booking has a price and all required details (service, address, schedule, contact), **When** staff confirms it, **Then** its status changes to confirmed and it becomes visible in the scheduling queue.
3. **Given** a booking is missing a required detail (e.g., no address), **When** staff attempts to confirm it, **Then** the system blocks the confirmation and explains what is missing.
4. **Given** any status change is made to a booking, **When** the change is saved, **Then** the system records who made the change, when, and why, in a way staff can later review.

---

### User Story 4 - Operations Schedules and Assigns a Cleaning Team (Priority: P2)

An operations manager takes confirmed bookings that have not yet been assigned, and assigns a cleaning team, a supervisor, and (optionally) a vehicle and time window, without creating scheduling conflicts.

**Why this priority**: Confirmed bookings must reach an actual team on the ground for the business to deliver the service and earn revenue. This is the bridge between "sold" and "delivered."

**Independent Test**: Can be tested by taking a set of confirmed bookings and independently assigning teams to them, verifying that no team is assigned to two overlapping jobs and that each assignment is visible on that team's schedule.

**Acceptance Scenarios**:

1. **Given** a confirmed, unassigned booking, **When** operations views suitable teams for its date, area, and required skills, **Then** only teams that are actually available and capable are offered.
2. **Given** operations assigns a team to a booking, **When** that team already has an overlapping assignment, **Then** the system blocks the assignment and warns of the conflict unless an authorized override is used, which is then recorded.
3. **Given** a team has been assigned to a booking, **When** the team leader opens their schedule, **Then** the new assignment appears there without delay.
4. **Given** operations wants a view of all unassigned confirmed bookings, **When** they open that view, **Then** they see every confirmed booking that still lacks a team, sorted so overdue ones are easy to spot.

---

### User Story 5 - Field Team Executes the Service and Completes Quality Checklist (Priority: P2)

A team leader and supervisor work through their day's assigned jobs: marking en route, arrival, and start; completing a service-specific quality checklist; and marking the job complete once required checklist items are satisfied.

**Why this priority**: Consistent execution and documented quality are the operational core of a cleaning business and directly drive the customer satisfaction and repeat-business goals of the project. Without this, "confirmed and assigned" bookings have no reliable way to be verified as actually and properly completed.

**Independent Test**: Can be tested by taking an assigned booking and independently walking it through arrival, execution, checklist completion, and supervisor review, confirming the booking cannot be marked complete while required checklist items are unfinished.

**Acceptance Scenarios**:

1. **Given** an assigned booking, **When** the team marks en route, arrival, and start in sequence, **Then** each timestamp is recorded and visible to office staff in real time.
2. **Given** a job has started, **When** the team opens the checklist, **Then** it shows the correct checklist for that specific service, with required items clearly marked.
3. **Given** required checklist items are incomplete, **When** the team or supervisor attempts to mark the booking complete, **Then** the system prevents completion and states which items are outstanding.
4. **Given** all required checklist items are completed and reviewed, **When** the supervisor marks the job complete, **Then** the booking status updates to completed and a customer follow-up (feedback request) is queued.
5. **Given** a checklist item is flagged as failed or an issue is noted, **When** the team records it, **Then** a quality issue record is created and linked to the booking for office follow-up.

---

### User Story 6 - Customer Feedback and Complaint/Rework Handling (Priority: P2)

After a service is completed, a customer rates the service and may leave a complaint. Staff triage and resolve complaints, including scheduling a rework visit linked to the original booking when needed.

**Why this priority**: Post-service quality follow-up is called out explicitly as a required capability, and resolving dissatisfaction quickly is essential to repeat business and reputation in a local-services market.

**Independent Test**: Can be tested by taking a completed booking, submitting a low rating and complaint against it, and independently walking that complaint through categorization, resolution, and (if needed) creation of a linked rework booking.

**Acceptance Scenarios**:

1. **Given** a completed booking, **When** the customer submits a rating and optional comments, **Then** the feedback is stored and linked to that booking.
2. **Given** a customer submits a low rating or complaint, **When** staff review it, **Then** they can categorize its severity and assign an internal owner.
3. **Given** a complaint requires a redo of the work, **When** staff schedule a rework visit, **Then** the new booking is clearly linked to the original booking and does not require the customer to re-enter their details.
4. **Given** a complaint has been resolved, **When** staff close it, **Then** the system requires resolution notes before allowing the complaint to be marked closed.

---

### User Story 7 - Staff Manage Recurring Subscriptions and Commercial Contracts (Priority: P3)

Staff configure a recurring cleaning package for a customer (e.g., weekly or monthly) or a basic commercial contract for a business client, and the system generates future bookings on that schedule without staff having to manually recreate each visit.

**Why this priority**: Recurring revenue (subscriptions and commercial contracts) is called out as a core part of the business model, but the business can launch and operate one-time bookings without it, making it lower priority than the core booking/execution/quality loop.

**Independent Test**: Can be tested by configuring a recurring package for a test customer and independently verifying that future bookings are generated on the correct schedule, and that pausing or canceling the subscription does not delete already-generated or completed bookings.

**Acceptance Scenarios**:

1. **Given** staff configure a recurring package (frequency, preferred day, price), **When** the schedule runs, **Then** future booking occurrences are generated automatically up to a safe planning horizon, without duplicates.
2. **Given** an active subscription, **When** staff adjust a single upcoming occurrence (e.g., reschedule one visit), **Then** the rest of the subscription's schedule is unaffected.
3. **Given** a customer wants to pause or cancel their subscription, **When** staff do so, **Then** no further occurrences are generated, but past bookings and history remain intact.
4. **Given** a commercial client with multiple service locations, **When** staff set up their account and contract details, **Then** bookings for that client can be tied to the correct location and billing contact.

---

### User Story 8 - Management Reviews Operational and Revenue Reports (Priority: P3)

An operations manager, administrator, or finance viewer reviews dashboards and reports covering bookings, revenue, team performance, and customer satisfaction to understand how the business is performing.

**Why this priority**: Reporting is essential for running the business well but depends on the other workflows (bookings, execution, feedback) already producing real data, so it is naturally built and validated last.

**Independent Test**: Can be tested by generating a known set of bookings, payments, and feedback records, then independently verifying that dashboard totals and exported reports match those records exactly.

**Acceptance Scenarios**:

1. **Given** a range of completed and in-progress bookings exist, **When** a manager opens the operations dashboard, **Then** they see accurate counts of today's bookings, unassigned confirmed bookings, and overdue bookings.
2. **Given** bookings with recorded payments exist, **When** a manager opens the revenue report, **Then** totals reflect only recorded payments and confirmed price snapshots, correctly filtered by the selected date range.
3. **Given** a finance viewer without operational-edit permission is logged in, **When** they attempt to change a booking assignment, **Then** the system denies the action while still allowing them to view financial reports.
4. **Given** a manager wants to share data outside the system, **When** they export a filtered report to a spreadsheet-compatible file, **Then** the export only includes the fields their role is permitted to see.

### Edge Cases

- What happens when a customer submits a booking for a date/time slot that fills up between when they started the form and when they submit it? The system MUST reject the request with a clear message and offer alternative times rather than silently accepting an overbooked slot.
- What happens when a quote's manual-review window expires before a customer responds? The system MUST mark the quote expired and require staff to re-issue it rather than letting a stale price be honored indefinitely.
- What happens when two different agents try to update the same booking at nearly the same time? The system MUST ensure the booking ends up in a single consistent state and does not silently lose one of the updates.
- What happens when a team assigned to a booking becomes unavailable after assignment (e.g., marked inactive)? The system MUST flag the affected bookings as needing reassignment rather than leaving them silently assigned to an unavailable team.
- What happens when a customer requests cancellation after a team has already been assigned or dispatched? The system MUST require a cancellation reason and record who cancelled, and MUST make the team's freed time visible for reassignment.
- What happens when a customer never responds to a submitted quote? The booking MUST remain visible in a "needs follow-up" or expired state rather than disappearing, so staff can proactively re-engage.
- What happens when a required checklist item cannot be completed on-site (e.g., access to a certain room was denied)? The system MUST allow the team to flag the reason so the booking is not stuck indeterminately, while still preventing an ordinary "silent skip."
- What happens when a customer has multiple addresses and an agent selects the wrong one? Address selection MUST clearly display the full address before submission so staff can catch the error before confirming.
- What happens when the same phone number is used for what are actually two different customers (e.g., a shared family/office line)? Staff with appropriate permission MUST be able to view and, if necessary, correct or merge customer records rather than the system silently overwriting one customer's data with another's.
- What happens when a recurring subscription's scheduled generation job runs twice for the same period (e.g., due to a retry)? The system MUST NOT create duplicate booking occurrences for the same subscription and period.
- What happens when a notification (e.g., WhatsApp template preparation) fails to send? The underlying booking action (creation, confirmation, status change) MUST still succeed; only the notification attempt is logged as failed for follow-up.
- What happens when a customer tries to view someone else's booking by guessing or incrementing a booking reference? The system MUST NOT reveal another customer's booking details from the reference alone.

## Requirements *(mandatory)*

### Functional Requirements

#### Roles, Access, and Auditability

- **FR-001**: System MUST support distinct roles — Public Customer, Customer-Service Agent, Operations Manager, Field Supervisor, Team Leader, Administrator, and Finance Viewer — each with a defined set of permitted actions.
- **FR-002**: System MUST require internal staff (all roles except Public Customer) to authenticate before accessing any internal booking, scheduling, customer, or reporting data.
- **FR-003**: System MUST enforce role permissions on every action attempted, not only on which screens are shown, so a user cannot perform an action by bypassing the normal navigation.
- **FR-004**: System MUST record an audit entry — who, what, when, and, where applicable, why — for every price override, cancellation, scheduling override, payment change, role change, and data export.
- **FR-005**: System MUST allow administrators to review the audit history for a booking or a staff action.

#### Service Catalog & Selection

- **FR-006**: System MUST let customers and staff browse a categorized catalog of cleaning services, including at minimum: comprehensive home/apartment/villa cleaning, steam cleaning of soft furnishings, post-construction and move-in/move-out cleaning, kitchen and bathroom deep cleaning, surface disinfection, water-tank cleaning, air-conditioner filter/unit cleaning, and recurring office/furnished-apartment cleaning.
- **FR-007**: System MUST let staff configure which services and optional add-ons are offered, including whether a service always requires manual price review.
- **FR-008**: System MUST let a customer or agent select one primary service plus any number of optional add-ons within a single booking.
- **FR-009**: System MUST let staff enable or disable individual services and service areas without deleting their historical data.

#### Booking Request & Property/Address Details

- **FR-010**: System MUST let a customer or agent create a booking request by providing: selected service(s), property type (apartment, villa, office, shop, clinic, furnished unit, or other), property size or room counts, contact name and phone number, city, neighborhood, address details, and a preferred date/time.
- **FR-011**: System MUST allow the customer or agent to record condition details relevant to pricing or scheduling (e.g., post-construction, move-in/out, heavy soil, pets, stairs) and free-text notes.
- **FR-012**: System MUST validate that the requested service area (city/neighborhood) is currently serviced before accepting a bookable request, and MUST clearly inform the requester when it is not.
- **FR-013**: System MUST prevent duplicate booking records from being created when a request is submitted more than once in quick succession (e.g., accidental double-submit or network retry).
- **FR-014**: System MUST generate a unique, customer-facing booking reference for every submitted request and display/return it to the requester upon submission.
- **FR-015**: System MUST require explicit acceptance of terms/consent before a booking request can be submitted.
- **FR-016**: System MUST NOT require a customer to create a permanent account in order to submit a booking request.
- **FR-017**: System MUST let internal staff look up an existing customer (primarily by phone number) and reuse their saved details and addresses when creating a booking on their behalf.
- **FR-018**: System MUST support every booking-creation step (service selection, address entry, scheduling, pricing, confirmation) being completed entirely by an internal staff member on behalf of a customer who is not interacting with the system directly.

#### Pricing & Quotation

- **FR-019**: System MUST calculate an estimated price automatically for services and conditions where a deterministic pricing rule exists, based on factors such as service selected, property type, size/room count, service area, day/time, and condition modifiers.
- **FR-020**: System MUST clearly flag a booking as requiring manual price review whenever automatic pricing is not confidently applicable, rather than presenting an unreliable estimate as final.
- **FR-021**: System MUST let authorized staff review, adjust, or override a calculated price, requiring a reason for any override.
- **FR-022**: System MUST support percentage or fixed-amount discounts with a defined validity period and usage limit, applied only by authorized staff.
- **FR-023**: System MUST support a configurable travel fee tied to service area.
- **FR-024**: System MUST permanently record the exact price breakdown (service price, add-ons, discounts, travel fee, tax, total) that applied to a booking at the time it was confirmed, so later changes to catalog prices never alter a historical booking's recorded price.
- **FR-025**: System MUST support a configurable tax amount or rate on bookings without requiring a fixed, hard-coded rate.

#### Scheduling & Team Assignment

- **FR-026**: System MUST let operations configure operating hours by day of week, plus closed dates and exceptional hours.
- **FR-027**: System MUST let operations define available time slots and each slot's remaining capacity based on team availability and service duration.
- **FR-028**: System MUST let operations view and manage bookings needing assignment, including a dedicated view of confirmed-but-unassigned bookings.
- **FR-029**: System MUST let operations assign a team, and optionally a vehicle and specific supervisor, to a confirmed booking, along with a planned start and end time.
- **FR-030**: System MUST detect and block assignment of a team to two bookings whose planned times overlap, unless an authorized override is explicitly used and recorded.
- **FR-031**: System MUST provide day, week, and per-team calendar views of scheduled bookings.
- **FR-032**: System MUST let staff reschedule a booking to a new date/time or cancel it, capturing a reason and the acting staff member.

#### Booking Lifecycle & Status

- **FR-033**: System MUST track each booking through a defined lifecycle from initial request through completion (e.g., requested, needs review, quoted, customer approved, confirmed, assigned, en route, arrived, in progress, quality review, completed), plus exception states for cancellation, no-show, reschedule, and rework.
- **FR-034**: System MUST prevent a booking from being confirmed unless it has a price, an address, a service date, and valid customer contact information.
- **FR-035**: System MUST prevent a booking from being assigned unless it has a team and a planned start/end time.
- **FR-036**: System MUST require an arrival record before a booking can move to "in progress," and MUST require completion of mandatory checklist items and a completion timestamp before a booking can move to "completed."
- **FR-037**: System MUST require a reason and record the acting staff member whenever a booking is cancelled.
- **FR-038**: System MUST record every status change to a booking, including the previous status, new status, actor, and timestamp, in a way staff can review as history.
- **FR-039**: System MUST only allow status transitions to be performed by roles authorized for that specific transition.

#### Customer Management

- **FR-040**: System MUST maintain a customer record (name, normalized phone number, optional email, preferred contact channel, marketing consent) that can be linked to multiple bookings and multiple addresses over time.
- **FR-041**: System MUST let staff record internal notes on a customer that are never shown to the customer, separate from any customer-visible notes.
- **FR-042**: System MUST let staff apply descriptive tags to a customer (e.g., VIP, commercial, complaint history, referral partner).
- **FR-043**: System MUST let administrators detect likely duplicate customer records and merge them, preserving booking history from both records.

#### Teams, Employees, and Vehicles

- **FR-044**: System MUST maintain employee profiles with active/inactive status and the skills or service types they are qualified for.
- **FR-045**: System MUST let staff define teams, each with a designated leader, an assigned supervisor, and a default team size.
- **FR-046**: System MUST let staff maintain a list of vehicles and their availability status, and optionally associate a vehicle with an assignment.
- **FR-047**: System MUST validate that a team's assignments do not create scheduling conflicts as described in FR-030.

#### Execution & Quality Checklists

- **FR-048**: System MUST provide a checklist template for each service, made up of required and optional items (e.g., yes/no, text, numeric, photo, signature, or issue-flag items).
- **FR-049**: System MUST snapshot the checklist template version in use at the time a booking's checklist is started, so later edits to the template do not alter a checklist already in progress or completed.
- **FR-050**: System MUST let the assigned team complete the checklist for their booking and let the supervisor review the completed checklist.
- **FR-051**: System MUST prevent a booking from being marked completed while any required checklist item is unfinished.
- **FR-052**: System MUST let a team member flag a checklist item as failed or as an issue, and MUST create a linked quality-issue record when this happens.

#### Quality, Feedback, and Complaints

- **FR-053**: System MUST let a customer submit a 1-to-5 rating and optional written feedback for a completed booking.
- **FR-054**: System MUST let staff categorize a complaint by type and severity, assign an internal owner, and track it to resolution.
- **FR-055**: System MUST require resolution notes before a complaint can be closed.
- **FR-056**: System MUST let staff create a rework booking that is explicitly linked to the original booking and its quality issue, without requiring the customer to re-enter their details.
- **FR-057**: System MUST alert operations when a booking receives a low rating or an unresolved complaint beyond a defined age.

#### Subscriptions & Commercial Contracts

- **FR-058**: System MUST let staff configure a recurring service package for a customer, specifying frequency (e.g., weekly, biweekly, monthly, or custom), preferred day/time, and price.
- **FR-059**: System MUST automatically generate future booking occurrences from an active subscription on its configured schedule, up to a bounded planning horizon, without creating duplicate occurrences even if the generation process runs more than once for the same period.
- **FR-060**: System MUST let staff modify a single upcoming occurrence of a subscription without altering the subscription's overall schedule.
- **FR-061**: System MUST let staff pause, resume, or cancel a subscription, and MUST preserve all historical bookings already generated from it.
- **FR-062**: System MUST support a basic commercial client account with billing contact information, one or more service locations, and basic contract details (dates, pricing terms, and a reference to supporting documentation).

#### Payments

- **FR-063**: System MUST let staff manually record a payment against a booking, including method (e.g., cash, bank transfer, point of sale, complimentary, other), amount, date, and a reference note.
- **FR-064**: System MUST track a payment status for each booking (e.g., unpaid, partially paid, paid, refunded-recorded, waived).
- **FR-065**: System MUST let authorized staff record a discount with a reason and the approving staff member.
- **FR-066**: System MUST base revenue figures only on confirmed price snapshots (FR-024) and recorded payments, not on live catalog prices.

#### Notifications & Message Templates

- **FR-067**: System MUST provide pre-written Arabic message templates for key booking events: quote ready, booking confirmed, appointment reminder, team en route, service completed, feedback request, reschedule, cancellation, and rework scheduled.
- **FR-068**: System MUST let staff quickly copy or open a pre-filled WhatsApp conversation using the appropriate template for a given booking and customer.
- **FR-069**: System MUST log every notification attempt (channel, template used, recipient, status, and failure reason if applicable).
- **FR-070**: System MUST ensure that a failed notification attempt never prevents or rolls back the underlying booking action it relates to.

#### Reporting & Dashboards

- **FR-071**: System MUST provide an operations dashboard showing, at minimum: today's bookings, unassigned confirmed bookings, and delayed/overdue bookings.
- **FR-072**: System MUST provide revenue reporting broken down by day, week, and month, along with average order value.
- **FR-073**: System MUST provide reporting on new versus repeat customers, subscription counts, and estimated recurring revenue.
- **FR-074**: System MUST provide reporting on team utilization, booking completion rate, cancellation rate, average customer rating, and complaint rate.
- **FR-075**: System MUST let authorized staff export filtered report data to a spreadsheet-compatible file.
- **FR-076**: System MUST restrict report and export access according to role, ensuring sensitive customer data is not included in exports beyond what a given role is permitted to see.

#### Language, Locale, and Data Integrity

- **FR-077**: System MUST present all customer-facing and staff-facing interfaces in Arabic with correct right-to-left presentation as the default, with an English-language mode available.
- **FR-078**: System MUST format dates, currency, and phone numbers according to Saudi/Arabic locale conventions in both the Arabic and English modes.
- **FR-079**: System MUST NOT expose a customer's full personal details (contact, exact address) via a booking reference alone; looking up a booking as a customer MUST require an additional unguessable verification element.
- **FR-080**: System MUST NOT record a customer's full phone number or exact address in general-purpose application logs.

### Key Entities

- **Customer**: A person or organization requesting cleaning services; holds contact details, preferred channel, marketing consent, internal tags/notes, and a history of bookings and addresses.
- **Address**: A serviceable location tied to a customer, including city, neighborhood, descriptive details, and optional map reference; associated with a service area for eligibility and travel-fee purposes.
- **Service Area**: A city or neighborhood the company currently serves, with an associated travel fee and an active/inactive status.
- **Service** (and **Add-On**): A cleaning offering in the catalog, with base/minimum pricing, typical duration, team-size needs, and whether it always requires manual price review; add-ons are optional extras attached to a booking.
- **Pricing Rule / Discount**: A configurable rule that adjusts price based on property type, area, size, timing, or condition modifiers; discounts have a reason, validity period, and usage limit.
- **Booking**: The central record of a requested or delivered cleaning job — selected services/add-ons, property and address details, schedule, status, price snapshot, and links to customer, assignment, checklist, feedback, and payment records.
- **Booking Status History**: A chronological record of every status change on a booking, including who made it, when, and why.
- **Employee**: An internal staff member who can be part of a cleaning team, with active status and recorded skills.
- **Team**: A group of employees (with a designated leader and supervisor) that can be assigned to bookings; has a default size and capabilities.
- **Vehicle**: A company vehicle that can be associated with a team assignment, with an availability status.
- **Assignment**: The link between a booking and the team (plus optional vehicle/supervisor) responsible for delivering it, including planned and actual execution timestamps.
- **Checklist Template / Checklist Run**: The versioned set of required and optional quality-control items defined per service, and the record of how a specific booking's checklist was completed.
- **Quality Issue**: A tracked problem (from a failed checklist item or a customer complaint) with category, severity, owner, resolution, and an optional link to a rework booking.
- **Feedback**: A customer's post-service rating and optional comments, linked to a specific booking.
- **Subscription**: A recurring service arrangement for a customer, defining frequency, schedule preferences, price, and the booking occurrences it generates.
- **Commercial Account / Contract**: A business client's account, its service locations, billing contact, and basic contract terms.
- **Payment**: A manually recorded payment against a booking, including method, amount, date, and reference.
- **Notification Log Entry**: A record of an attempted customer communication — channel, template, recipient, status, and failure reason if applicable.
- **Role / Permission**: The set of actions a given staff role is authorized to perform across the system.
- **Audit Log Entry**: A record of a sensitive action taken by a staff member — who, what, when, and (where applicable) why.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A customer can go from opening the service catalog to receiving a booking reference in under 5 minutes on a mobile phone.
- **SC-002**: At least 95% of booking requests are automatically assigned either a final estimated price or a clear "pending review" status, with no requests left in an ambiguous or missing-price state.
- **SC-003**: Zero duplicate bookings are created from repeated or retried submissions of the same request during testing and in production monitoring.
- **SC-004**: 100% of bookings that reach "confirmed" status have a complete, valid price, address, schedule, and contact record — none are confirmed with missing required information.
- **SC-005**: Zero team double-bookings occur for overlapping time windows without an explicit, recorded staff override.
- **SC-006**: 100% of bookings marked "completed" have all required quality-checklist items satisfied at the time of completion.
- **SC-007**: Every submitted customer complaint has a recorded resolution (explanation, refund record, or rework visit) before it can be closed, with zero complaints closed without resolution notes.
- **SC-008**: Recurring subscriptions generate the correct number of upcoming booking occurrences with zero duplicate occurrences, even when the generation process is retried.
- **SC-009**: Revenue and operational dashboard figures match underlying booking and payment records exactly when spot-checked against a known test dataset.
- **SC-010**: 100% of price overrides, cancellations, scheduling overrides, payment changes, role changes, and data exports have a corresponding audit record.
- **SC-011**: Every screen and workflow in the system remains fully usable, without loss of function, when tested in Arabic with right-to-left layout on a phone-sized screen.
- **SC-012**: A customer-service agent can complete every step of a booking on behalf of a phone caller without the caller needing to view or interact with the website themselves.
- **SC-013**: An unauthorized user (or a user without the specific required role) is denied access in 100% of attempts to view sensitive customer data, financial reports, or perform restricted actions such as price overrides or role changes.
- **SC-014**: A booking reference alone, without the accompanying verification element, cannot be used to retrieve another customer's full personal or booking details.

## Assumptions

1. The initial release is a responsive web experience reachable from any modern mobile or desktop browser; native mobile apps are out of scope for this feature.
2. Arabic is the default language and right-to-left layout for all customer-facing and staff-facing screens; English is available as a fully supported secondary language.
3. Customers are not required to create or maintain a permanent account to submit a booking request; internal staff, however, must always authenticate.
4. Prices can be calculated automatically where a reliable rule exists, but remain reviewable and overridable by authorized operations staff for every booking.
5. Payments are recorded manually against a booking (cash, bank transfer, point of sale, complimentary, or other); online payment collection is not part of this feature.
6. WhatsApp communication in this feature consists of pre-written templates and click-to-chat links prepared by staff or the system; fully automated, provider-integrated WhatsApp messaging is not required for this feature to be considered complete.
7. Service availability (what can be booked, when) is governed by service area, date, time slot, and team capacity/skills.
8. A booking may include exactly one primary service plus any number of add-ons.
9. Before-and-after photos, where used, are optional and require explicit customer consent before being used for any purpose beyond internal quality review.
10. The business operates from a single operations center with a limited, configurable number of cleaning teams at launch; the platform's scheduling and reporting must remain usable as that number grows over time.
11. "Older customers booking by phone" are served entirely through the customer-service agent booking workflow (User Story 2); no separate accessibility mode outside standard WCAG 2.1 AA conformance is assumed necessary for this population, since they do not interact with the interface directly.
12. Government licensing, staff recruitment/payroll, vehicle and equipment procurement, and marketing campaign execution are business-operational activities outside this platform's scope; only lead capture and reporting related to marketing are included.
