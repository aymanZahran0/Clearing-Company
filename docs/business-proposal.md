# Implementation Plan: Nuqaa Asir Cleaning Booking & Operations Platform

**Branch**: `001-cleaning-company-platform`  
**Date**: 2026-07-12  
**Spec**: `/specs/001-cleaning-company-platform/spec.md`  
**Source**: `cleaning_company_abha_khamis_proposal(3).pdf`  
**Input**: Business proposal for establishing and operating a professional cleaning company in Abha, Khamis Mushait, and nearby service areas.

> This plan converts the business proposal into a software implementation plan suitable for GitHub Spec Kit. It covers the customer booking experience and the internal operations platform. Physical procurement, hiring, licensing, vehicle purchase, and cleaning-equipment acquisition remain business-operational work outside the software scope.

---

## Summary

Build an Arabic-first, responsive web platform for a cleaning company serving Abha and Khamis Mushait. The platform will allow customers and customer-service agents to request cleaning services, receive or approve a quote, select a date and time, provide an address, and receive booking updates. Internal users will manage the service catalog, pricing, bookings, schedules, mobile cleaning teams, checklists, customer feedback, recurring packages, and operational reports.

The first release will use a modular monolith to minimize complexity and speed up launch. It will provide:

- A public Arabic/RTL website and service catalog.
- A guided booking request flow.
- An admin and operations dashboard.
- Configurable services, packages, pricing rules, and service areas.
- Team scheduling and assignment.
- Execution checklists and quality follow-up.
- Customer feedback and rework management.
- Monthly subscriptions and commercial contracts at a basic level.
- WhatsApp-friendly communication without requiring a full WhatsApp API integration in the MVP.
- Operational analytics based on bookings, revenue, service type, team performance, and customer satisfaction.

The proposal's business benchmark of approximately four daily orders with an average order value of SAR 400 will be represented as an initial dashboard target only, not as a guaranteed system outcome.

---

## Business Context

### Service Area

- Abha.
- Khamis Mushait.
- Nearby neighborhoods that are enabled by operations staff.

### Target Customers

- Families requiring weekly or monthly cleaning.
- Villa and large-apartment owners.
- Customers preparing for or recovering from events.
- Customers moving into or out of a property.
- Furnished apartments and tourist accommodation operators.
- Small offices and companies.
- Shops, cafés, clinics, and small service centers.
- Real-estate offices, property managers, and maintenance partners.

### Service Catalog

1. Comprehensive home, apartment, and villa cleaning.
2. Steam cleaning for sofas, majlis seating, carpets, rugs, mattresses, and curtains.
3. Post-construction and move-in/move-out cleaning.
4. Kitchen and bathroom deep cleaning.
5. Surface disinfection and sanitization.
6. Water-tank cleaning and sanitization.
7. Basic air-conditioner filter and indoor-unit cleaning.
8. Recurring monthly cleaning for offices and furnished apartments.

### Service Model

- Mobile cleaning teams.
- Advance booking and scheduling.
- Two to four workers per team depending on service scope.
- Clear confirmation of price and arrival time.
- Standard checklist for each service.
- Post-service quality follow-up.
- One-time visits, monthly subscriptions, and annual contracts.

---

## Scope

### MVP In Scope

- Public marketing pages.
- Service browsing and service details.
- Arabic/RTL booking request flow.
- Customer contact details and address collection.
- Approximate quote calculation.
- Manual quote review and price override by authorized staff.
- Booking confirmation and lifecycle management.
- Availability calendar and time-slot management.
- Team and employee management.
- Assignment of teams, vehicles, and supervisors.
- Service checklists.
- Booking notes and internal comments.
- Customer feedback and complaint/rework records.
- Configurable service areas and travel fees.
- Basic subscriptions and recurring-booking generation.
- Basic commercial-client contracts.
- Manual payment recording.
- WhatsApp message templates and click-to-chat links.
- Dashboard and operational reports.
- Audit trail for important administrative actions.

### Deferred to Later Releases

- Native iOS and Android applications.
- Live team GPS tracking.
- Fully automated WhatsApp Business API messaging.
- Online Mada, Apple Pay, or card payments.
- Advanced route optimization.
- Payroll and employee attendance.
- Inventory and cleaning-material stock management.
- Public marketplace for independent cleaners.
- AI-based pricing or demand forecasting.
- Full accounting-system integration.
- Multi-city franchise management.

### Explicitly Out of Scope

- Purchasing vehicles, cleaning machines, uniforms, or consumables.
- Employee recruitment, visa processing, payroll, and accommodation.
- Government licensing and commercial registration.
- Advertising campaign execution outside publishing website content and tracking leads.
- Technical maintenance procedures for air conditioners, tanks, or other specialist equipment.

---

## Assumptions

1. The MVP is a responsive web application, not a mobile application.
2. Arabic is the primary language and all customer-facing screens support RTL.
3. English localization is supported structurally but may be delivered after launch.
4. Customers may submit a booking without creating a permanent account.
5. Internal employees must authenticate and use role-based access control.
6. Prices may be calculated automatically but remain reviewable by operations staff.
7. The MVP records payment status but does not process online payments.
8. WhatsApp communication starts with templates and click-to-chat links; automated provider integration is optional.
9. Service availability is controlled by city, neighborhood, date, time slot, team capacity, and service duration.
10. A booking may contain one primary service and multiple add-ons.
11. Before-and-after photos are optional and require a clear customer-consent rule before production use.
12. The physical business launches with one operations center and a small number of teams.

---

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 22 LTS  
**Primary Dependencies**: Next.js 15+, React 19+, Tailwind CSS, Prisma ORM, Zod, React Hook Form, Auth.js or equivalent internal authentication library  
**Storage**: PostgreSQL 16+; S3-compatible object storage only when file uploads are enabled  
**Testing**: Vitest, React Testing Library, Playwright, database integration tests  
**Target Platform**: Responsive web application deployed to a Linux-compatible managed platform  
**Project Type**: Full-stack web application / modular monolith  
**Primary Locale**: Arabic (`ar-SA`), RTL  
**Secondary Locale**: English-ready, deferred  
**Performance Goals**:

- Public-page Largest Contentful Paint below 2.5 seconds on a typical 4G connection.
- Read API requests below 500 ms at p95 under normal launch load.
- Write API requests below 800 ms at p95, excluding third-party integrations.
- Booking form submission completes without duplicate records when retried.
- Admin list pages load within 1 second for the first 10,000 records using pagination and indexes.

**Availability Goal**: 99.5% monthly availability for the MVP  
**Scale/Scope**:

- Initial target: 4 to 20 bookings per day.
- Design capacity: at least 100 bookings per day without architectural changes.
- Up to 50 internal users.
- Up to 50 cleaning teams.
- Up to 10,000 customers and 50,000 bookings before major re-architecture.

**Constraints**:

- Mobile-first responsive design.
- Arabic text must not break in forms, PDFs, notifications, or reports.
- Personally identifiable customer data must not appear in public URLs or logs.
- All important operational state changes must be auditable.
- The system must remain usable when external messaging or maps providers are unavailable.
- No microservices in the MVP.

---

## Constitution Check

> No project constitution was supplied. The following provisional gates should be copied into `.specify/memory/constitution.md` or reconciled with the existing project constitution before implementation.

### Gate 1: Arabic-First Experience

- [x] Arabic is the default UI language.
- [x] All customer and internal interfaces support RTL correctly.
- [x] Dates, currency, phone numbers, and addresses are formatted for Saudi users.

### Gate 2: Simplicity and Launch Speed

- [x] Use one deployable modular monolith.
- [x] Avoid microservices, event buses, and complex infrastructure in the MVP.
- [x] Add integrations behind interfaces only when there is an immediate use case.

### Gate 3: Security and Privacy

- [x] Apply least-privilege role permissions.
- [x] Validate all inputs at client and server boundaries.
- [x] Protect customer contact and address data.
- [x] Record audit events for sensitive changes.
- [x] Complete a local privacy and data-retention review before production launch.

### Gate 4: Testable Business Flows

- [x] Core booking, assignment, completion, and complaint flows require automated tests.
- [x] Pricing rules require deterministic unit tests.
- [x] Status transitions must be validated on the server.

### Gate 5: Operational Resilience

- [x] Booking creation must be idempotent.
- [x] External messaging failures must not block booking creation.
- [x] Backups and restore testing are required before launch.

### Gate 6: Observable Operations

- [x] Application errors, failed notifications, and booking-state changes are logged.
- [x] Dashboard metrics are based on database records, not client-side calculations.

**Pre-Phase-0 Result**: PASS with the assumptions recorded in this plan.  
**Post-Phase-1 Re-check Required**: Yes.

---

## Actors and Roles

### Public Customer

- Browses services and packages.
- Requests a quote and booking.
- Supplies contact, property, address, and preferred schedule information.
- Receives a booking reference and updates.
- Submits a rating or complaint after service.

### Customer-Service Agent

- Creates bookings received by telephone or WhatsApp.
- Updates customer details.
- Reviews requested dates and service details.
- Sends quote and confirmation templates.
- Records complaints and customer feedback.

### Operations Manager

- Manages service catalog, prices, service areas, capacity, and time slots.
- Reviews and approves quotes.
- Assigns teams and supervisors.
- Monitors booking statuses and delays.
- Reviews operational dashboards.

### Field Supervisor

- Reviews assigned bookings.
- Confirms arrival, start, and completion.
- Completes quality checklist.
- Records issues, missing items, and rework needs.

### Team Leader

- Views team schedule and customer location.
- Confirms execution milestones.
- Completes task checklist and notes.
- Uploads permitted evidence when enabled.

### Administrator

- Manages staff accounts and roles.
- Configures system settings and message templates.
- Reviews audit logs.
- Manages access and security controls.

### Finance Viewer

- Reviews booking amounts, discounts, payment status, and revenue reports.
- Cannot alter operational assignments unless separately authorized.

---

## Core User Journeys

### Journey 1: Customer Requests a One-Time Cleaning

1. Customer opens the service catalog.
2. Customer selects a service and add-ons.
3. Customer provides property type, estimated size, rooms, and special notes.
4. Customer provides name, Saudi phone number, city, neighborhood, address, and optional map link.
5. Customer selects preferred date and time window.
6. System displays an estimated price or states that manual review is required.
7. Customer accepts terms and submits.
8. System creates a unique booking reference and prevents duplicate submission.
9. Customer service reviews the booking, adjusts the quote if needed, and confirms it.
10. Customer receives a WhatsApp-ready confirmation message.

### Journey 2: Agent Creates a Phone or WhatsApp Booking

1. Agent searches for an existing customer by phone number.
2. Agent creates or selects the customer and address.
3. Agent records requested services and preferred time.
4. System calculates an estimate.
5. Agent submits for operations approval or confirms within permission limits.
6. Booking enters the scheduling queue.

### Journey 3: Operations Assigns a Team

1. Operations opens unassigned confirmed bookings.
2. System displays suitable teams based on date, service skills, capacity, and service area.
3. Operations assigns a team, supervisor, vehicle, and planned duration.
4. System validates against schedule conflicts.
5. Assignment appears on the team schedule.
6. Customer-service confirmation is prepared.

### Journey 4: Team Executes the Service

1. Team leader opens today's assigned bookings.
2. Team confirms en-route and arrival states.
3. Team starts the job.
4. Service-specific checklist becomes available.
5. Team records checklist results, notes, and allowed evidence.
6. Supervisor reviews and marks the service completed or requires rework.
7. Customer receives a follow-up request.

### Journey 5: Complaint and Rework

1. Customer submits a low rating or complaint.
2. Customer service categorizes severity and description.
3. Operations reviews the original checklist and assignment.
4. Operations records resolution: explanation, partial refund record, or rework visit.
5. Rework booking is linked to the original booking.
6. Complaint is closed only after resolution notes and customer follow-up.

### Journey 6: Monthly Subscription

1. Customer selects or is offered a recurring package.
2. Staff configures frequency, service, preferred day, price, and start/end dates.
3. System generates future bookings according to a safe scheduling horizon.
4. Operations may adjust individual occurrences without changing the entire subscription.
5. Pausing or canceling the subscription does not delete historical bookings.

---

## Booking Lifecycle

```text
REQUESTED
  -> NEEDS_REVIEW
  -> QUOTED
  -> CUSTOMER_APPROVED
  -> CONFIRMED
  -> ASSIGNED
  -> EN_ROUTE
  -> ARRIVED
  -> IN_PROGRESS
  -> QUALITY_REVIEW
  -> COMPLETED
```

Alternative terminal and exception states:

```text
CANCELLED_BY_CUSTOMER
CANCELLED_BY_COMPANY
NO_SHOW
RESCHEDULE_REQUESTED
REWORK_REQUIRED
REWORK_SCHEDULED
REWORK_COMPLETED
```

### Transition Rules

- Only authorized internal users may move a booking from `NEEDS_REVIEW` to `QUOTED`.
- A booking cannot become `CONFIRMED` without a price, address, service date, and customer contact.
- A booking cannot become `ASSIGNED` without a team and planned start/end time.
- A team cannot be double-booked for overlapping assignments.
- `IN_PROGRESS` requires an arrival timestamp.
- `COMPLETED` requires the mandatory checklist items and completion timestamp.
- Cancellation requires a reason and actor.
- Rework must reference the original booking and quality issue.
- All transitions create a booking-history record.

---

## Functional Modules

### 1. Public Website

- Home page with trust-focused value proposition.
- Service catalog and detailed service pages.
- Service-area page for Abha and Khamis Mushait.
- Packages and recurring-service page.
- Commercial contracts and partnership lead form.
- Contact, phone, and WhatsApp calls to action.
- Frequently asked questions.
- Booking entry point on all service pages.
- SEO metadata, structured data, and Arabic URLs or stable slugs.
- Before-and-after gallery only after consent and content-approval rules are implemented.

### 2. Booking Request

- Service and add-on selection.
- Property type: apartment, villa, office, shop, clinic, furnished unit, other.
- Property-size input using area or simplified room counts.
- Bedrooms, living rooms/majlis, bathrooms, kitchens, floors, and optional notes.
- Condition modifiers such as post-construction, move-in/out, heavy soil, pets, or stairs.
- Customer contact validation.
- City, neighborhood, address text, coordinates, and map/share URL.
- Preferred date and time window.
- Estimated duration.
- Estimated quote with clear indication when it is non-final.
- Consent and terms checkbox.
- Idempotency key to prevent duplicate booking submission.
- Confirmation page with booking reference.

### 3. Service Catalog and Pricing

- Service categories and services.
- Base price, minimum price, estimated duration, and team-size requirement.
- Add-ons and optional quantities.
- Pricing rules by property type, area band, room count, city/neighborhood, day, time window, and condition modifier.
- Travel fee and service-area eligibility.
- Percentage or fixed discounts with validity period and usage limit.
- Manual override requiring reason and permission.
- Price snapshot stored on each confirmed booking so later catalog changes do not alter history.
- Tax fields configurable without hard-coding a specific rate.

### 4. Availability and Scheduling

- Operating hours by weekday.
- Closed dates and exceptional hours.
- Service-specific duration.
- Team capacity and skills.
- Time-slot capacity.
- Travel buffer between bookings.
- Conflict detection.
- Manual scheduling override with warning and audit event.
- Calendar views: day, week, team, and unassigned queue.

### 5. Customer Management

- Customer record keyed primarily by normalized phone number.
- Multiple addresses per customer.
- Booking history.
- Internal notes separated from customer-visible notes.
- Customer tags such as VIP, commercial, furnished apartments, complaint history, or referral partner.
- Preferred contact channel.
- Marketing-consent field.
- Duplicate-customer detection and merge process restricted to administrators.

### 6. Teams, Employees, and Vehicles

- Employee profile and active/inactive status.
- Team definition and team leader.
- Skills supported by employee and team.
- Default team size.
- Supervisor assignment.
- Vehicle profile and availability.
- Shift availability.
- Schedule conflict validation.
- No payroll or HR-document processing in MVP.

### 7. Execution Checklists

- Checklist template per service.
- Required and optional checklist items.
- Item types: yes/no, text, number, photo, signature, issue flag.
- Checklist version snapshot linked to the booking.
- Team completion and supervisor review.
- Issue creation from a failed item.
- Required items must be completed before final completion.

### 8. Quality, Feedback, and Complaints

- Customer rating from 1 to 5.
- Optional text feedback.
- Complaint categories and severity.
- Internal owner and response deadline.
- Resolution notes.
- Rework booking linkage.
- Quality dashboard by service, team, and month.
- Low-rating alert for operations.

### 9. Subscriptions and Contracts

- Recurring package definition.
- Weekly, biweekly, monthly, or custom frequency.
- Preferred weekday and time.
- Fixed or calculated recurring price.
- Start date, end date, pause, resume, and cancel.
- Generated booking occurrences with status and linkage.
- Commercial account with billing contact and service locations.
- Basic contract metadata and document reference.
- No automated invoicing or payment collection in MVP.

### 10. Payments and Discounts

- Payment methods: cash, bank transfer, point of sale, complimentary, other.
- Payment statuses: unpaid, partially paid, paid, refunded-recorded, waived.
- Manual payment entry with amount, date, reference, and user.
- Discount reason and approver.
- Revenue reports use confirmed price snapshots and payment records.
- Online gateway integration is deferred.

### 11. Notifications and Templates

- Arabic templates for quote, confirmation, reminder, team-on-the-way, completion, feedback, reschedule, and cancellation.
- Copy-to-clipboard and WhatsApp click-to-chat.
- Optional provider adapter for automated WhatsApp or SMS in a later phase.
- Notification log stores channel, template, recipient, status, and failure reason.
- Notification failure never rolls back a successful booking transaction.

### 12. Admin and Reporting

- Today's bookings.
- Unassigned confirmed bookings.
- Delayed or overdue bookings.
- Bookings by service and city.
- Daily, weekly, and monthly revenue.
- Average order value.
- New versus repeat customers.
- Subscription count and recurring revenue estimate.
- Team utilization.
- Completion and cancellation rates.
- Average rating and complaint rate.
- Export filtered tables to CSV.
- Do not expose sensitive customer data in broad exports without permission.

---

## Data Model

### User

- `id`
- `name`
- `email`
- `phone`
- `passwordHash` or authentication-provider identifier
- `roleId`
- `status`
- `lastLoginAt`
- timestamps

### Role and Permission

- `Role`: id, name, description
- `Permission`: id, key, description
- Many-to-many role-permission mapping

### Customer

- `id`
- `fullName`
- `phoneNormalized`
- `phoneDisplay`
- `email`
- `preferredChannel`
- `marketingConsent`
- `customerType`
- `notesInternal`
- timestamps

### Address

- `id`
- `customerId`
- `label`
- `city`
- `neighborhood`
- `street`
- `buildingNumber`
- `unitNumber`
- `landmark`
- `latitude`
- `longitude`
- `mapUrl`
- `serviceAreaId`
- timestamps

### ServiceArea

- `id`
- `nameAr`
- `nameEn`
- `city`
- `active`
- `travelFee`
- optional polygon or radius configuration

### ServiceCategory

- `id`
- `nameAr`
- `nameEn`
- `slug`
- `sortOrder`
- `active`

### Service

- `id`
- `categoryId`
- `nameAr`
- `nameEn`
- `descriptionAr`
- `basePrice`
- `minimumPrice`
- `defaultDurationMinutes`
- `defaultTeamSize`
- `requiresManualQuote`
- `active`
- timestamps

### AddOn

- `id`
- `serviceId`
- `nameAr`
- `pricingMode`
- `unitPrice`
- `durationImpactMinutes`
- `active`

### PricingRule

- `id`
- `serviceId`
- `ruleType`
- `conditionsJson`
- `calculationType`
- `amount`
- `priority`
- `startsAt`
- `endsAt`
- `active`

### Booking

- `id`
- `referenceNumber`
- `customerId`
- `addressId`
- `source`
- `status`
- `preferredStartAt`
- `scheduledStartAt`
- `scheduledEndAt`
- `estimatedDurationMinutes`
- `propertyType`
- `propertyDetailsJson`
- `customerNotes`
- `internalNotes`
- `subtotalSnapshot`
- `discountSnapshot`
- `travelFeeSnapshot`
- `taxSnapshot`
- `totalSnapshot`
- `currency`
- `quoteExpiresAt`
- `confirmedAt`
- `completedAt`
- `cancellationReason`
- `createdByUserId`
- timestamps

### BookingItem

- `id`
- `bookingId`
- `serviceId`
- `addOnId`
- `descriptionSnapshot`
- `quantity`
- `unitPriceSnapshot`
- `totalSnapshot`
- `durationMinutesSnapshot`

### BookingStatusHistory

- `id`
- `bookingId`
- `fromStatus`
- `toStatus`
- `reason`
- `actorUserId`
- `createdAt`

### Employee

- `id`
- `userId` optional
- `name`
- `phone`
- `status`
- `skillsJson`
- timestamps

### Team

- `id`
- `name`
- `leaderEmployeeId`
- `supervisorEmployeeId`
- `active`
- team-member relation

### Vehicle

- `id`
- `name`
- `plateReference`
- `status`
- `capacityNotes`

### Assignment

- `id`
- `bookingId`
- `teamId`
- `vehicleId`
- `supervisorEmployeeId`
- `plannedStartAt`
- `plannedEndAt`
- `actualEnRouteAt`
- `actualArrivedAt`
- `actualStartedAt`
- `actualCompletedAt`
- `status`
- timestamps

### ChecklistTemplate and ChecklistTemplateItem

- Service-specific, versioned checklist structure.
- Required flags, type, label, sort order, and validation rules.

### ChecklistRun and ChecklistResult

- Snapshot of checklist version for a booking.
- Result values, completion actor, review actor, and timestamps.

### QualityIssue

- `id`
- `bookingId`
- `checklistResultId` optional
- `category`
- `severity`
- `description`
- `status`
- `ownerUserId`
- `resolution`
- `reworkBookingId`
- timestamps

### Feedback

- `id`
- `bookingId`
- `rating`
- `comment`
- `submittedAt`
- `followUpRequired`

### Subscription

- `id`
- `customerId`
- `addressId`
- `serviceConfigurationJson`
- `frequency`
- `preferredWeekday`
- `preferredTimeWindow`
- `priceSnapshot`
- `startsAt`
- `endsAt`
- `status`
- `nextGenerationAt`
- timestamps

### CommercialAccount and Contract

- Company/client details, billing contact, service locations, contract dates, pricing terms, and document reference.

### Payment

- `id`
- `bookingId`
- `method`
- `status`
- `amount`
- `reference`
- `paidAt`
- `recordedByUserId`
- timestamps

### NotificationLog

- Booking/customer linkage, channel, template, recipient, payload snapshot, status, failure reason, and timestamps.

### AuditLog

- Actor, action, entity type, entity id, safe before/after summary, IP/device metadata where appropriate, and timestamp.

---

## API Contract Outline

All APIs use `/api/v1` and return a consistent error object:

```json
{
  "error": {
    "code": "BOOKING_SLOT_UNAVAILABLE",
    "message": "The selected time is no longer available.",
    "fieldErrors": {},
    "requestId": "req_..."
  }
}
```

### Public Endpoints

```text
GET    /api/v1/public/services
GET    /api/v1/public/services/{slug}
GET    /api/v1/public/service-areas
POST   /api/v1/public/quotes/estimate
GET    /api/v1/public/availability
POST   /api/v1/public/bookings
GET    /api/v1/public/bookings/{reference}/summary
POST   /api/v1/public/bookings/{reference}/feedback
```

The public booking summary endpoint must require an additional verification token and must not expose full customer data using the reference number alone.

### Internal Booking Endpoints

```text
GET    /api/v1/bookings
POST   /api/v1/bookings
GET    /api/v1/bookings/{id}
PATCH  /api/v1/bookings/{id}
POST   /api/v1/bookings/{id}/quote
POST   /api/v1/bookings/{id}/confirm
POST   /api/v1/bookings/{id}/reschedule
POST   /api/v1/bookings/{id}/cancel
POST   /api/v1/bookings/{id}/transition
GET    /api/v1/bookings/{id}/history
```

### Scheduling Endpoints

```text
GET    /api/v1/schedule
GET    /api/v1/teams/availability
POST   /api/v1/bookings/{id}/assignments
PATCH  /api/v1/assignments/{id}
POST   /api/v1/assignments/{id}/en-route
POST   /api/v1/assignments/{id}/arrive
POST   /api/v1/assignments/{id}/start
POST   /api/v1/assignments/{id}/complete
```

### Checklist and Quality Endpoints

```text
GET    /api/v1/assignments/{id}/checklist
PATCH  /api/v1/checklist-runs/{id}/results
POST   /api/v1/checklist-runs/{id}/submit
POST   /api/v1/checklist-runs/{id}/review
POST   /api/v1/bookings/{id}/quality-issues
PATCH  /api/v1/quality-issues/{id}
POST   /api/v1/quality-issues/{id}/create-rework
```

### Catalog and Configuration Endpoints

```text
/api/v1/services
/api/v1/add-ons
/api/v1/pricing-rules
/api/v1/service-areas
/api/v1/operating-hours
/api/v1/discounts
/api/v1/checklist-templates
/api/v1/message-templates
```

### Customer, Subscription, and Contract Endpoints

```text
/api/v1/customers
/api/v1/customers/{id}/addresses
/api/v1/subscriptions
/api/v1/commercial-accounts
/api/v1/contracts
```

### Reporting Endpoints

```text
GET /api/v1/reports/operations-summary
GET /api/v1/reports/revenue
GET /api/v1/reports/services
GET /api/v1/reports/teams
GET /api/v1/reports/quality
GET /api/v1/reports/export.csv
```

---

## Project Structure

### Documentation

```text
specs/001-cleaning-company-platform/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── openapi.yaml
│   ├── booking-state-machine.md
│   └── notification-templates.md
├── checklists/
│   ├── requirements.md
│   ├── security.md
│   └── arabic-rtl.md
└── tasks.md
```

### Source Code

```text
src/
├── app/
│   ├── (public)/
│   │   ├── page.tsx
│   │   ├── services/
│   │   ├── booking/
│   │   ├── packages/
│   │   ├── commercial/
│   │   └── contact/
│   ├── (auth)/
│   ├── admin/
│   │   ├── dashboard/
│   │   ├── bookings/
│   │   ├── schedule/
│   │   ├── customers/
│   │   ├── teams/
│   │   ├── services/
│   │   ├── pricing/
│   │   ├── subscriptions/
│   │   ├── quality/
│   │   ├── reports/
│   │   └── settings/
│   └── api/v1/
├── components/
│   ├── ui/
│   ├── forms/
│   ├── booking/
│   ├── schedule/
│   └── reports/
├── modules/
│   ├── auth/
│   ├── customers/
│   ├── catalog/
│   ├── pricing/
│   ├── bookings/
│   ├── scheduling/
│   ├── teams/
│   ├── checklists/
│   ├── quality/
│   ├── subscriptions/
│   ├── payments/
│   ├── notifications/
│   └── reporting/
├── lib/
│   ├── db/
│   ├── validation/
│   ├── localization/
│   ├── security/
│   ├── logging/
│   └── integrations/
├── styles/
└── types/

prisma/
├── schema.prisma
├── migrations/
└── seed.ts

tests/
├── unit/
├── integration/
├── contract/
└── e2e/
```

**Structure Decision**: Use one Next.js full-stack application organized as domain modules. This avoids frontend/backend duplication while maintaining clear module boundaries. Database transactions and business rules live in server-only module services, not React components or route handlers.

---

## Phase 0: Research and Decision Records

Generate `research.md` and record a decision, alternatives, and rationale for each item.

### R0.1 Hosting and Database

Research managed hosting options, database location, backups, restore procedure, and operational cost. Select one production platform and one staging platform.

### R0.2 Authentication

Select internal authentication approach. Confirm whether customers remain guest-only or receive phone-based access in a later phase.

### R0.3 WhatsApp and SMS

Compare manual click-to-chat, WhatsApp Business Platform providers, and SMS providers. MVP must work without automated messaging.

### R0.4 Maps and Address Collection

Decide between text address plus shared map URL, Google Maps picker, or another provider. Store coordinates independently of provider-specific identifiers.

### R0.5 Pricing Validation

Workshop the exact pricing formula with operations. Confirm which services can be priced automatically and which always need inspection or manual approval.

### R0.6 Time-Slot and Capacity Model

Validate duration assumptions, travel buffers, team skill requirements, and maximum bookings per time window.

### R0.7 File Uploads and Consent

Decide whether before/after photos are included at launch. Define consent, access, retention, and deletion rules before enabling uploads.

### R0.8 Privacy and Retention

Complete a local legal and operational review for customer data, employee data, marketing consent, uploaded images, and retention periods.

### R0.9 Online Payments

Document a future payment-gateway integration approach, but do not include gateway implementation in MVP tasks unless the project owner changes scope.

### R0.10 Analytics and Marketing Tracking

Define consent-aware analytics, conversion events, campaign attribution, and Google Business Profile/Maps tracking requirements.

---

## Phase 1: Design Artifacts

### 1. Data Model

Generate `data-model.md` with:

- Entity diagrams.
- Required and optional fields.
- Unique constraints.
- Database indexes.
- Cascade and deletion rules.
- Status enumerations.
- Price-snapshot policy.
- Audit policy.
- PII classification.

### 2. API Contracts

Generate `contracts/openapi.yaml` including:

- Public and authenticated endpoints.
- Request/response examples in Arabic-friendly UTF-8.
- Pagination and filtering.
- Error codes.
- Idempotency requirements.
- Authentication requirements.
- Role permissions.

### 3. Booking State Machine

Generate `contracts/booking-state-machine.md` containing:

- Valid transitions.
- Required fields for each transition.
- Allowed roles.
- Side effects.
- Notification events.
- Audit events.
- Retry and idempotency rules.

### 4. Notification Templates

Generate `contracts/notification-templates.md` for Arabic messages:

- Quote ready.
- Booking confirmed.
- Appointment reminder.
- Team en route.
- Reschedule.
- Cancellation.
- Service completed.
- Feedback request.
- Rework scheduled.

### 5. Quickstart

Generate `quickstart.md` with:

- Local prerequisites.
- Environment variables.
- Database creation and migration.
- Seed accounts.
- Seed services and service areas.
- Running unit, integration, and E2E tests.
- Starting background jobs.
- Building and deploying.

### 6. UI Wireframes

Document low-fidelity screen flows for:

- Public home and service details.
- Booking wizard.
- Booking confirmation.
- Admin dashboard.
- Booking list and details.
- Schedule calendar.
- Team daily view.
- Checklist execution.
- Quality issue and rework.
- Reports.

---

## Implementation Milestones

### Milestone 1: Foundation

**Outcome**: Deployable Arabic-first application with authentication and database foundation.

- Initialize Next.js, TypeScript, Tailwind, linting, formatting, and test tooling.
- Configure RTL, Arabic fonts, locale helpers, and design tokens.
- Configure PostgreSQL and Prisma.
- Implement internal authentication and RBAC.
- Add request logging, error handling, health check, and audit foundation.
- Create staging and production deployment pipelines.

**Exit Criteria**:

- Staging deployment succeeds.
- Admin can authenticate.
- Unauthorized users cannot access admin routes.
- Arabic layout passes RTL smoke tests.

### Milestone 2: Catalog, Service Areas, and Pricing

**Outcome**: Operations can configure services and calculate repeatable estimates.

- Service categories, services, and add-ons.
- Service areas and travel fees.
- Pricing rules and discounts.
- Quote estimation service.
- Seed the services listed in the business proposal.
- Unit tests for pricing calculations.

**Exit Criteria**:

- Same inputs always return the same price breakdown.
- Manual-review services are identified correctly.
- Disabled areas cannot create bookable quotes.

### Milestone 3: Public Website and Booking

**Outcome**: A customer can submit a complete booking request.

- Public pages and service details.
- Booking wizard.
- Availability lookup.
- Customer and address creation.
- Booking reference and verification token.
- Click-to-WhatsApp confirmation.
- Analytics events for booking funnel.

**Exit Criteria**:

- Customer can submit from a mobile browser.
- Double-click or retry does not create duplicate bookings.
- Validation errors are understandable in Arabic.

### Milestone 4: Customer Service and Booking Operations

**Outcome**: Staff can manage requests, quotes, confirmation, and rescheduling.

- Booking list, filters, and details.
- Agent-created booking.
- Quote review and price override.
- Status transitions and history.
- Reschedule and cancel flows.
- Customer records and addresses.
- Message templates.

**Exit Criteria**:

- Every transition is permission-checked and audited.
- Historical price snapshots do not change when catalog prices change.

### Milestone 5: Scheduling and Team Assignment

**Outcome**: Operations can assign conflict-free teams and vehicles.

- Employees, teams, skills, and vehicles.
- Operating hours, shifts, and closed dates.
- Assignment and conflict detection.
- Day/week/team calendar.
- Unassigned queue.
- Team daily schedule.

**Exit Criteria**:

- Overlapping team assignments are blocked unless authorized override is used.
- Assignment appears immediately in the team view.

### Milestone 6: Execution, Checklist, and Quality

**Outcome**: Field teams can execute jobs with consistent quality controls.

- Assignment execution statuses.
- Versioned checklist templates.
- Checklist completion.
- Supervisor review.
- Feedback, complaint, and quality issue management.
- Rework booking generation.

**Exit Criteria**:

- Booking cannot complete with missing mandatory checklist items.
- Low ratings and failed checklist items can create follow-up work.

### Milestone 7: Subscriptions and Commercial Accounts

**Outcome**: Staff can manage recurring customers and basic business contracts.

- Subscription configuration.
- Recurring booking generation job.
- Pause, resume, and cancel.
- Commercial accounts, locations, and contract metadata.
- Recurring-revenue report estimate.

**Exit Criteria**:

- Generated occurrences do not duplicate when a scheduled job is retried.
- Editing one occurrence does not unexpectedly change the full subscription.

### Milestone 8: Reporting, Hardening, and Launch

**Outcome**: Production-ready MVP with measurable operations.

- Operations and revenue dashboards.
- CSV exports with permission controls.
- Performance optimization and indexes.
- Accessibility and RTL review.
- Security review.
- Backup and restore test.
- Incident and rollback runbook.
- Production seed and launch checklist.

**Exit Criteria**:

- Critical E2E flows pass.
- Restore from backup is demonstrated.
- No high-severity security findings remain open.
- Launch metrics and alert thresholds are configured.

---

## Background Jobs

Use a database-backed job mechanism or managed scheduler. Do not introduce a separate message broker for the MVP.

Jobs:

- Generate recurring bookings.
- Send or prepare appointment reminders.
- Mark expired quotes.
- Flag delayed bookings.
- Aggregate daily reporting metrics when needed.
- Retry failed automated notifications when an integration is enabled.

All jobs must be idempotent and record last successful execution.

---

## Security and Privacy Requirements

- Server-side validation for every mutation.
- Role and permission checks inside service methods, not only in UI navigation.
- Secure password or authentication-provider handling.
- Rate limiting for public quote, booking, and feedback endpoints.
- CSRF protection where applicable.
- Secure session cookies.
- No customer phone number, exact address, or token in application logs.
- Booking public lookup requires reference plus an unguessable verification token or OTP.
- Audit log for price override, cancellation, assignment override, payment change, role change, and data export.
- Protect exports with explicit permissions.
- Encrypt transport using HTTPS.
- Database encryption and backup protection must be provided by hosting configuration.
- File uploads, when enabled, require MIME validation, size limits, private access, and malware-scanning strategy.
- Define deletion and retention behavior before production launch.

---

## Accessibility and Arabic/RTL Requirements

- Use semantic HTML and keyboard-accessible controls.
- Meet WCAG 2.1 AA as the implementation target.
- Use logical CSS properties instead of hard-coded left/right where possible.
- Test forms, tables, calendars, dialogs, and charts in RTL.
- Arabic labels must remain readable on small mobile screens.
- Use Arabic-friendly date and currency formatting.
- Phone-number input accepts Saudi formats and stores a normalized value.
- Error messages and validation summaries appear in Arabic.
- Do not reverse numbers, booking references, URLs, or phone numbers incorrectly in RTL layouts.

---

## Testing Strategy

### Unit Tests

- Pricing rule ordering and calculations.
- Discount and travel-fee logic.
- Booking status transitions.
- Availability and conflict detection.
- Subscription occurrence generation.
- Phone and address normalization.
- Permission checks.

### Integration Tests

- Booking creation transaction.
- Quote snapshot persistence.
- Team assignment conflict handling.
- Checklist completion rules.
- Rework booking linkage.
- Payment recording.
- Audit-log creation.
- Background-job idempotency.

### Contract Tests

- OpenAPI request and response schemas.
- Error-code consistency.
- Authentication and authorization expectations.
- Public endpoint data minimization.

### E2E Tests

1. Public customer creates a booking.
2. Agent reviews and confirms quote.
3. Operations assigns a team.
4. Team executes checklist and completes booking.
5. Customer submits positive feedback.
6. Customer submits complaint and staff schedules rework.
7. Staff creates a subscription and recurring occurrence.
8. Unauthorized user is denied sensitive access.
9. Arabic mobile layout works through the full booking flow.

### Manual Launch Tests

- Real mobile devices on common Saudi cellular connections.
- WhatsApp links on iOS, Android, and desktop.
- Printing or exporting Arabic reports.
- Time-zone and daylight-saving behavior.
- Backup restoration.
- Operations workflow with actual staff roles.

---

## Observability

- Structured server logs with request ID.
- Error monitoring for client and server exceptions.
- Metrics for booking creation, quote failure, notification failure, job failure, and API latency.
- Alerts for elevated error rate, repeated job failure, database connection issues, and unavailable public booking flow.
- Audit-log viewer restricted to administrators.
- Operational dashboard for overdue and unassigned bookings.

---

## Deployment and Environments

### Environments

- Local development.
- Staging with non-production test data.
- Production.

### Required Configuration

- Database URL.
- Authentication secret and allowed origins.
- Application base URL.
- Default locale and time zone.
- Optional maps API key.
- Optional messaging-provider credentials.
- Optional object-storage credentials.
- Error-monitoring DSN.

### Release Process

1. Run lint, type checks, unit, integration, and contract tests.
2. Build application.
3. Apply backward-compatible database migrations.
4. Deploy to staging.
5. Run E2E smoke tests.
6. Approve production release.
7. Apply migration and deploy.
8. Run production smoke tests.
9. Monitor key metrics and rollback if required.

---

## Seed Data

Seed the development and staging environments with:

- Cities: Abha and Khamis Mushait.
- Example neighborhoods and travel fees marked as test data.
- The six main service groups from the proposal.
- Example add-ons for rooms, bathrooms, sofas, carpets, and floors.
- One admin, one operations manager, one customer-service agent, one supervisor, and two teams.
- Example booking records covering every major status.
- Arabic notification templates.
- Checklist templates per service.

Never seed production with shared passwords or fictional customers containing real-looking personal data.

---

## Success Metrics

### Product Metrics

- Booking-form completion rate.
- Quote-to-confirmation conversion rate.
- Repeat-customer rate.
- Subscription conversion rate.
- Average customer rating.
- Complaint and rework rate.

### Operational Metrics

- Bookings per day.
- Average order value.
- On-time arrival rate.
- Average service duration versus planned duration.
- Team utilization.
- Unassigned confirmed bookings.
- Cancellation rate.
- Time from request to confirmation.

### Technical Metrics

- Public-page performance.
- API error rate.
- Booking duplicate rate.
- Notification failure rate.
- Background-job success rate.
- Availability and restore readiness.

---

## Acceptance Criteria for MVP

The MVP is accepted when:

1. Customers can browse all launch services in Arabic and submit a booking from a mobile device.
2. Staff can create bookings received by phone or WhatsApp.
3. The system calculates an estimate or flags the request for manual review.
4. Authorized staff can quote, confirm, reschedule, and cancel bookings.
5. Operations can configure working hours and assign teams without schedule conflicts.
6. Field staff can view assignments and complete a service-specific checklist.
7. A booking cannot be marked completed until required quality items are satisfied.
8. Customers can submit feedback, and staff can create and track rework.
9. Staff can configure a recurring package and generate future booking occurrences without duplicates.
10. Revenue and operational dashboards reflect database records accurately.
11. All core flows are covered by automated E2E tests.
12. Arabic/RTL, security, backup, and production launch checklists pass.

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Pricing is not defined precisely enough | Incorrect quotes and customer disputes | Keep manual-review mode, store calculation breakdown, and validate rules with operations before launch |
| Service duration varies widely | Delays and schedule conflicts | Use configurable duration, buffers, team size, and post-launch actual-duration analysis |
| WhatsApp provider approval or outage | Missed automated updates | MVP supports manual templates and click-to-chat; notifications do not block bookings |
| Address quality is inconsistent | Team delays | Require neighborhood, landmark, phone, and optional map URL/coordinates |
| Staff bypass status rules | Poor auditability and reporting | Enforce transitions server-side and record audit history |
| Arabic RTL defects appear late | Poor customer usability | Add RTL checks from Milestone 1 and Arabic E2E tests |
| Recurring job creates duplicates | Duplicate visits and customer frustration | Use deterministic occurrence keys and database unique constraints |
| Sensitive data is exposed in exports or logs | Privacy and reputational harm | Redact logs, permission exports, minimize public responses, and conduct launch review |
| Scope expands into payroll, inventory, and mobile apps | Delayed launch | Keep deferred modules outside MVP and require explicit scope change |
| Low-quality or incomplete checklist use | Inconsistent service quality | Mandatory items, supervisor review, training, and quality dashboards |

---

## Open Decisions Before Task Generation

These decisions should be resolved through `/speckit.clarify` or Phase 0 research before final task generation:

1. Final commercial name and branding: use “Nuqaa Asir” or another registered name.
2. Exact launch neighborhoods and travel-fee rules.
3. Detailed pricing formula for each service.
4. Whether customers receive an account/OTP portal in MVP.
5. Whether maps API integration is required at launch.
6. Whether automated WhatsApp or SMS is required at launch.
7. Whether before-and-after photos are required.
8. Exact working hours and slot duration.
9. Payment methods accepted and whether tax invoices are needed.
10. Refund, cancellation, no-show, and rework policies.
11. Data retention periods and marketing-consent wording.
12. Hosting provider and production budget.

---

## Complexity Tracking

No constitution violations are currently required. The selected architecture is a single modular monolith with one relational database.

| Potential Complexity | Current Decision | Reason |
|---|---|---|
| Separate frontend and backend deployments | Rejected for MVP | One full-stack application is faster to build and operate |
| Microservices | Rejected | Initial scale does not justify distributed-system overhead |
| Message broker | Rejected | Database-backed jobs are sufficient for launch volume |
| Native mobile applications | Deferred | Responsive web covers customer and staff MVP workflows |
| Live GPS tracking | Deferred | Requires mobile background permissions, privacy controls, and additional operations complexity |
| Automated payment gateway | Deferred | Manual payment recording supports launch requirements |

---

## Recommended Spec Kit Workflow

```text
/speckit.constitution
/speckit.specify
/speckit.clarify
/speckit.plan
/speckit.checklist
/speckit.tasks
/speckit.analyze
/speckit.implement
/speckit.converge
```

Suggested input for `/speckit.specify`:

```text
Build an Arabic-first responsive booking and operations platform for a professional cleaning company serving Abha and Khamis Mushait. Customers and customer-service agents must be able to request cleaning services, provide property and address details, receive an estimated or manually reviewed quote, choose an available appointment, and receive a booking reference. Internal staff must manage services, configurable prices, service areas, customers, bookings, teams, schedules, execution checklists, quality issues, feedback, recurring subscriptions, basic commercial contracts, manual payments, message templates, and operational reports. The MVP must support RTL, role-based access, auditable booking status transitions, conflict-free team assignment, and post-service quality follow-up. Online payments, native apps, live GPS, payroll, and inventory are deferred.
```

Suggested input for `/speckit.plan`:

```text
Use a TypeScript full-stack modular monolith with Next.js, React, Tailwind CSS, PostgreSQL, Prisma, Zod, and server-side role-based authorization. The application is Arabic-first and RTL, mobile responsive, tested with Vitest and Playwright, and deployed as one web application. Use database-backed idempotent background jobs. The MVP records manual payments and uses WhatsApp message templates/click-to-chat; payment gateways, automated WhatsApp, native apps, live GPS, payroll, and inventory are deferred.
```
