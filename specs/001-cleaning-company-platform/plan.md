# Implementation Plan: Nuqaa Asir Cleaning Booking & Operations Platform

**Branch**: `001-cleaning-company-platform` | **Date**: 2026-07-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-cleaning-company-platform/spec.md`, plus explicit technical direction supplied directly to `/speckit-plan` (React/Vite/TS frontend, Express/Prisma/PostgreSQL backend, two-role CUSTOMER/ADMIN model, monorepo with `apps/web` + `apps/api` + `packages/shared`).

## Summary

Deliver the two-role (Customer, Admin) cleaning-services booking and operations platform described in `spec.md` as a monorepo: a React/Vite Customer Portal + Admin Dashboard SPA (`apps/web`) backed by an Express/Prisma REST API (`apps/api`), sharing Zod validation schemas and TypeScript types through `packages/shared`. Customers register, browse the catalog, get an instant-or-manually-reviewed quote, book, track status, pay offline, and review/complain. Admin — the single internal role — confirms/prices/schedules/executes/completes bookings, runs the quality checklist, manages subscriptions and commercial accounts, records payments, and reviews reports and audit logs. No separate operations-manager, supervisor, driver, or agent accounts exist anywhere in the system; internal handling is captured only as a free-text note on the booking (per `spec.md` FR-001, FR-029).

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 22 LTS (both `apps/web` and `apps/api`)

**Primary Dependencies**:
- Frontend (`apps/web`): React 18, Vite 5, React Router 6, Redux Toolkit + RTK Query, Tailwind CSS, Ant Design, react-i18next
- Backend (`apps/api`): Express 4, Prisma ORM, Zod, `jsonwebtoken`, `bcrypt`, `helmet`, `express-rate-limit`, `pino`
- Shared (`packages/shared`): Zod schemas, TypeScript types, API contract constants

**Storage**: PostgreSQL 16+ (Prisma); S3-compatible object storage for service catalog images (`ServiceImage`)

**Testing**: Vitest + React Testing Library (`apps/web`); Vitest + Supertest (`apps/api`); Playwright (cross-app E2E)

**Target Platform**: Responsive web app (browser) on a Linux-compatible managed host; API deployed as a standalone Node.js service

**Project Type**: Web application — decoupled SPA + REST API monorepo (see `research.md` R1, R9 for why this differs from the constitution's originally-named Next.js monolith)

**Performance Goals**:
- Public-page Largest Contentful Paint < 2.5s on a typical 4G connection (achieved via build-time prerendering of public routes — `research.md` R9)
- Read API requests < 500ms p95; write API requests < 800ms p95 under normal launch load
- Booking form submission never creates duplicate records under retry (idempotency key)
- Admin list pages load within 1s for the first 10,000 records (pagination + indexes)

**Availability Goal**: 99.5% monthly availability for the MVP

**Constraints**:
- Mobile-first responsive design (Tailwind + Ant Design, RTL-aware)
- Arabic text must not break in forms, PDFs/receipts, or reports
- Personally identifiable customer data must not appear in public URLs or logs (FR-077, FR-078)
- All important operational state changes must be auditable (FR-004)
- System must remain usable when external messaging/maps providers are unavailable (WhatsApp is click-to-chat, not a hard dependency)
- No microservices; one Express API service, one PostgreSQL database
- Exactly two roles (CUSTOMER, ADMIN); no configurable/custom roles in v1 (explicit user constraint)

**Scale/Scope**:
- Initial target: 4–20 bookings/day; design capacity ≥100 bookings/day without architectural changes
- Up to 10,000 customers and 50,000 bookings before major re-architecture
- Exactly one internal Admin role — no per-team/per-employee scale dimension (structurally simpler than the original multi-role plan)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design below.*

| Principle | Status | Notes |
|---|---|---|
| I. Production-Grade Code Quality | **PASS** | TS strict mode across both apps; Zod validation shared client/server via `packages/shared`; every pricing/state-transition path covered by Vitest unit + Supertest integration tests (`research.md` R8); pricing/booking errors fail loudly and are logged via `pino` structured logging, never silently defaulted |
| II. Mobile-First Responsive Design | **PASS** | Tailwind + Ant Design responsive breakpoints, 360px minimum target, 44×44px touch targets enforced in component library conventions (detailed at task-generation time) |
| III. Bilingual & RTL-Correct Internationalization | **PASS** | `react-i18next` + Ant Design `ConfigProvider direction="rtl"` + Tailwind logical properties (`research.md` R2); every FR in the Language/Locale section of `spec.md` mapped in `traceability.md` |
| IV. Accessibility & Phone-Booking Parity | **PASS**, with terminology note | WCAG 2.1 AA target carried into task generation; the "customer-service agent" phrasing in the constitution is now fulfilled by the Admin role (User Story 2) — no functional gap, but see Recommendation below |
| V. Performance & SEO by Default | **CONDITIONAL PASS** | A Vite CSR SPA does not natively satisfy "server-rendered or statically generated" for public pages. **Mitigation**: public, unauthenticated routes (home, catalog, service detail, service areas, FAQ) are pre-rendered at build time (`research.md` R9); authenticated Customer Portal/Admin Dashboard routes are standard CSR, which is acceptable since SEO/first-load CWV do not apply behind a login wall |
| Technology & Platform Constraints | **DEVIATION (justified)** | Constitution names Next.js specifically; this plan uses a decoupled Vite SPA + Express API instead, per explicit user direction. Justified in Complexity Tracking below. Still one deployable API + one deployable static frontend + one PostgreSQL database — no increase in the *architectural* complexity class (no microservices, no message broker) |
| Development Workflow & Quality Gates | **PASS** | Locale check, mobile-viewport check, and state-transition integration tests are all built into `quickstart.md`'s validation scenarios and will be enforced as CI gates at task-generation time |

**Recommendation (non-blocking)**: Run `/speckit-constitution` after this plan is accepted to (a) update Technology & Platform Constraints to name the actual Vite/Express/monorepo stack, and (b) reword Principle IV's "customer-service agent" to "Admin" to match the two-role model finalized in `spec.md`.

**Pre-Phase-0 Result**: PASS (one conditional item, one justified deviation, both mitigated and documented).
**Post-Phase-1 Re-check**: See below — unchanged; Phase 1 design did not introduce any new deviation.

## Project Structure

### Documentation (this feature)

```text
specs/001-cleaning-company-platform/
├── spec.md              # Business requirements (two-role model)
├── plan.md              # This file
├── research.md          # Phase 0 decisions and constitution-deviation rationale
├── data-model.md         # Phase 1 entity/field/relationship design
├── contracts/
│   └── openapi.yaml      # Phase 1 REST API contract
├── traceability.md       # Every FR/SC mapped to screens, modules, entities, endpoints, permissions, tests
├── quickstart.md         # Phase 1 end-to-end validation guide
└── tasks.md              # Phase 2 output (/speckit-tasks — not created by this command)
```

### Source Code (repository root)

```text
apps/
├── web/                              # Customer Portal + Admin Dashboard (React + Vite + TS)
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   │   ├── store.ts              # Redux store setup
│   │   │   ├── router.tsx            # React Router route tree (public/customer/admin)
│   │   │   └── AppProviders.tsx      # i18n, Ant Design ConfigProvider (RTL), Redux Provider
│   │   ├── api/                      # RTK Query API slices (one per backend module)
│   │   │   ├── authApi.ts
│   │   │   ├── customersApi.ts
│   │   │   ├── servicesApi.ts
│   │   │   ├── bookingsApi.ts
│   │   │   ├── quotesApi.ts
│   │   │   ├── checklistsApi.ts
│   │   │   ├── reviewsApi.ts
│   │   │   ├── subscriptionsApi.ts
│   │   │   ├── paymentsApi.ts
│   │   │   ├── discountCodesApi.ts
│   │   │   ├── notificationsApi.ts
│   │   │   ├── reportsApi.ts
│   │   │   └── contentApi.ts
│   │   ├── features/                 # Redux slices for client-only state (wizard step, filters)
│   │   ├── locales/
│   │   │   ├── ar/
│   │   │   └── en/
│   │   ├── components/
│   │   │   ├── ui/                   # Shared design-system wrappers around AntD + Tailwind
│   │   │   ├── forms/
│   │   │   └── layout/               # RTL-aware shell, nav, mobile drawer
│   │   ├── customer/                 # Customer Portal (CP) route modules
│   │   │   ├── pages/
│   │   │   │   ├── Home.tsx
│   │   │   │   ├── ServiceCatalog.tsx
│   │   │   │   ├── ServiceDetail.tsx
│   │   │   │   ├── BookingWizard/
│   │   │   │   │   ├── PropertyStep.tsx
│   │   │   │   │   ├── AddressStep.tsx
│   │   │   │   │   ├── ScheduleStep.tsx
│   │   │   │   │   ├── AddOnsStep.tsx
│   │   │   │   │   ├── QuoteReviewStep.tsx
│   │   │   │   │   └── ConfirmationStep.tsx
│   │   │   │   ├── BookingsList.tsx
│   │   │   │   ├── BookingDetail.tsx
│   │   │   │   ├── Profile.tsx
│   │   │   │   ├── Addresses.tsx
│   │   │   │   ├── InvoicesAndPayments.tsx
│   │   │   │   ├── ReviewForm.tsx
│   │   │   │   ├── ComplaintForm.tsx
│   │   │   │   ├── Notifications.tsx
│   │   │   │   ├── Login.tsx / Register.tsx / ForgotPassword.tsx / ResetPassword.tsx
│   │   │   │   └── PublicBookingLookup.tsx   # reference + token lookup, no auth
│   │   │   └── routes.tsx
│   │   ├── admin/                    # Admin Dashboard (AD) route modules
│   │   │   ├── pages/
│   │   │   │   ├── Login.tsx
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── customers/ (List, Detail, Merge)
│   │   │   │   ├── catalog/ (Categories, Services, ServiceEditor, AddOns, ServiceImages)
│   │   │   │   ├── pricing/ (PricingRules, DiscountCodes)
│   │   │   │   ├── bookings/ (List, Detail, NewPhoneBooking, ConfirmDialog, ScheduleDialog, ChecklistRunner)
│   │   │   │   ├── schedule/ (CalendarDay, CalendarWeek, TimeSlots, OperatingHours, ClosedDates)
│   │   │   │   ├── subscriptions/ (List, Editor, OccurrenceEditor)
│   │   │   │   ├── commercial/ (Accounts, Contracts)
│   │   │   │   ├── payments/ (List, RecordPaymentDialog, Invoices)
│   │   │   │   ├── quality/ (Reviews, Complaints, ComplaintDetail, ReworkDialog)
│   │   │   │   ├── notifications/ (Templates, Log)
│   │   │   │   ├── content/ (WebsiteContent, FAQs)
│   │   │   │   ├── settings/ (SystemSettings)
│   │   │   │   └── reports/ (OperationsSummary, Revenue, Services, Quality, AuditLogViewer, Export)
│   │   │   └── routes.tsx
│   │   ├── guards/                   # RequireAuth, RequireRole(ADMIN) route wrappers
│   │   ├── lib/                      # i18n init, date/currency formatters, idempotency-key helper
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.ts                # includes prerender plugin config for public routes (research.md R9)
│   ├── tailwind.config.ts
│   └── tests/
│       ├── unit/                     # Vitest + RTL component tests
│       └── setup.ts
│
├── api/                               # Express + Prisma REST API
│   ├── src/
│   │   ├── modules/                  # one folder per backend module (matches user's explicit list)
│   │   │   ├── auth/                 # register, login, refresh, logout, password reset
│   │   │   ├── customers/
│   │   │   ├── admin/                # admin-account-management (create/suspend other Admins)
│   │   │   ├── addresses/
│   │   │   ├── service-categories/
│   │   │   ├── services/
│   │   │   ├── service-add-ons/
│   │   │   ├── pricing-rules/
│   │   │   ├── quotes/
│   │   │   ├── bookings/
│   │   │   ├── booking-status-history/
│   │   │   ├── availability/          # operating hours, closed dates, time slots
│   │   │   ├── subscriptions/
│   │   │   ├── payments/              # payments + invoices
│   │   │   ├── discount-codes/
│   │   │   ├── notifications/
│   │   │   ├── reviews-and-complaints/ # reviews + quality issues
│   │   │   ├── checklists/
│   │   │   ├── service-images/
│   │   │   ├── reports/
│   │   │   ├── website-content/
│   │   │   ├── settings/
│   │   │   └── audit-logs/
│   │   │       # each module folder: controller.ts, service.ts, routes.ts, schema.ts (Zod), *.test.ts
│   │   ├── middleware/
│   │   │   ├── authenticate.ts       # JWT verification
│   │   │   ├── requireRole.ts        # CUSTOMER | ADMIN guard
│   │   │   ├── validateRequest.ts    # Zod middleware
│   │   │   ├── rateLimit.ts
│   │   │   ├── errorHandler.ts       # centralized error handling → ErrorResponse shape
│   │   │   ├── requestLogger.ts      # pino + requestId
│   │   │   └── auditLogger.ts        # writes AuditLog on flagged mutating routes
│   │   ├── jobs/
│   │   │   ├── generateSubscriptionOccurrences.ts
│   │   │   ├── expireStaleQuotes.ts
│   │   │   └── flagOverdueBookings.ts
│   │   ├── lib/
│   │   │   ├── prisma.ts
│   │   │   ├── pricing/              # pure pricing-calculation functions (unit-testable in isolation)
│   │   │   ├── bookingStateMachine.ts
│   │   │   ├── idempotency.ts
│   │   │   ├── phoneNormalization.ts
│   │   │   ├── storage/              # object-storage adapter interface + concrete implementation
│   │   │   └── logging.ts
│   │   ├── openapi/                  # serves contracts/openapi.yaml at /api/v1/docs
│   │   └── app.ts / server.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   └── tests/
│       ├── integration/              # Supertest, one file per module
│       └── unit/                     # pricing, state machine, normalization
│
└── packages/
    └── shared/
        ├── src/
        │   ├── schemas/              # Zod schemas — imported by both apps/web forms and apps/api validation
        │   ├── types/                # inferred TS types from schemas + enums (BookingStatus, Role, etc.)
        │   ├── constants/            # notification template keys, checklist item types, etc.
        │   └── api-contract/         # typed request/response shapes matching openapi.yaml
        └── package.json

tests/
└── e2e/                              # Playwright, spans apps/web + apps/api together
    ├── customer-registration-and-booking.spec.ts
    ├── admin-phone-booking.spec.ts
    ├── booking-confirmation-and-pricing.spec.ts
    ├── scheduling-and-capacity.spec.ts
    ├── execution-and-checklist.spec.ts
    ├── review-and-rework.spec.ts
    ├── subscriptions.spec.ts
    ├── reports.spec.ts
    └── access-control-and-rtl.spec.ts
```

**Structure Decision**: pnpm workspace monorepo with three packages — `apps/web` (Vite SPA covering both the Customer Portal and Admin Dashboard behind route-level role guards, not two separate deployables), `apps/api` (single Express service, module-per-domain matching the user's explicit backend module list one-to-one), and `packages/shared` (Zod schemas + types consumed by both, keeping client and server validation identical by construction). This satisfies the user's explicit `apps/web` / `apps/api` / `packages/shared` structure while keeping deployment topology simple: one API process, one static frontend build, one database — consistent with the constitution's "no microservices" simplicity gate despite the two-app split (see Constitution Check above).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| Decoupled Vite SPA + Express API instead of the constitution's named single Next.js full-stack app | Explicit, detailed user direction for this exact stack (React/Vite/RTK Query/Ant Design frontend, Express/Prisma backend, monorepo layout) | A Next.js rewrite would directly contradict the user's `/speckit-plan` input, which specified the frontend and backend frameworks, the API style, and the monorepo package layout in explicit detail |
| Public-route build-time prerendering layered onto an otherwise-CSR SPA (`research.md` R9) instead of full SSR everywhere | Needed to satisfy constitution Principle V (SEO/CWV on public pages) without abandoning the user-directed Vite/CSR architecture for the app as a whole | Full SSR (e.g., adopting Next.js) was rejected for the same reason as above; leaving public pages CSR-only was rejected because it would fail Principle V outright with no mitigation |
| Booking status enum simplified to 9 top-level values with sub-state timestamps, rather than spec.md's full 11-state lifecycle enum verbatim (`research.md` R5) | Explicit user-provided status list in the `/speckit-plan` input | Implementing spec.md's longer enum verbatim would directly contradict the user's explicit instruction; the chosen design preserves every required granular timestamp/audit point via child fields/records instead of extra enum values, so no FR is actually weakened |

## Post-Phase-1 Constitution Re-check

Phase 1 design (`data-model.md`, `contracts/openapi.yaml`) introduced no new principle violations beyond the two already justified above:
- Data model keeps price snapshots immutable (Principle I), keeps PII out of logs/exports by classification (Principle I, IV), and every entity list is bilingual where user-facing (Principle III).
- API contract enforces role checks per-endpoint (Principle I, IV) and rate-limits auth/public booking endpoints (constitution security requirements referenced via `research.md` R10).
- No entity or endpoint reintroduces a third role or a structured staff/team/vehicle record, honoring the explicit two-role constraint throughout Phase 1 artifacts.

**Result**: PASS (same conditional/deviation set as pre-Phase-0, both still mitigated).

## Generated Artifacts

- [research.md](./research.md) — Phase 0 decisions, including the two constitution deviations and their mitigations
- [data-model.md](./data-model.md) — 28 entities, fields, relationships, state-transition rules, PII classification
- [contracts/openapi.yaml](./contracts/openapi.yaml) — full REST API contract under `/api/v1`
- [traceability.md](./traceability.md) — every FR-001–FR-079 and SC-001–SC-014 mapped to Customer/Admin screens, backend module, DB entities, endpoint(s), permission, validation, and test layer
- [quickstart.md](./quickstart.md) — environment setup + 10 end-to-end validation scenarios (V1–V10) covering every User Story plus security/RTL smoke checks

## Next Step

Run `/speckit-tasks` to generate the dependency-ordered `tasks.md` from this plan, `data-model.md`, and `contracts/openapi.yaml`. No code has been written in this phase, per instruction.
